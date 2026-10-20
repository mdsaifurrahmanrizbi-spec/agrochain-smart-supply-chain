
import { LocalGodown, DeliveryPartner } from '../types';

export interface GodownRoutingResult {
  godown?: LocalGodown;
  isInactive?: boolean;
  requiresManualRouting: boolean;
  reason?: string;
}

export interface DeliveryPartnerAssignmentResult {
  partner?: DeliveryPartner;
  isSuccess: boolean;
  reason?: string;
  eligibleCandidatesCount: number;
}

/**
 * Normalize text for case-insensitive area matching.
 * Empty values remain empty and cannot match another empty value.
 */
function cleanText(str?: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Match complete area names instead of arbitrary substrings.
 *
 * Examples:
 * "Uttara, Dhaka" matches "Uttara".
 * "Mirpur 10" matches "Mirpur".
 * "Mirpur" does not match "Mirpurghat".
 */
function areaMatches(target: string, area: string): boolean {
  const normalizedTarget = cleanText(target);
  const normalizedArea = cleanText(area);

  if (!normalizedTarget || !normalizedArea) {
    return false;
  }

  return ` ${normalizedTarget} `.includes(
    ` ${normalizedArea} `
  );
}

/**
 * Identifies the destination Local Godown based on the
 * customer's delivery address and city.
 *
 * Rules:
 * - Never assign a shipment to an inactive godown.
 * - If no suitable active godown can be identified,
 *   require manual routing.
 * - Never silently assign a shipment to an unrelated godown.
 */
export function selectDestinationLocalGodown(
  customerAddress: string,
  customerCity: string = 'Dhaka',
  godowns: LocalGodown[]
): GodownRoutingResult {
  const addressClean = cleanText(customerAddress);
  const cityClean = cleanText(customerCity);

  // 1. Match configured godown service areas.
  for (const godown of godowns) {
    const serviceAreas = Array.isArray(godown.serviceAreas)
      ? godown.serviceAreas
      : [];

    for (const area of serviceAreas) {
      if (
        !area ||
        !addressClean ||
        !areaMatches(addressClean, area)
      ) {
        continue;
      }

      if (godown.status !== 'ACTIVE') {
        return {
          godown,
          isInactive: true,
          requiresManualRouting: true,
          reason:
            `Local godown "${godown.name}" serves area "${area}" ` +
            `but is currently INACTIVE. ` +
            `Consignment held for manual routing review.`,
        };
      }

      return {
        godown,
        isInactive: false,
        requiresManualRouting: false,
      };
    }
  }

  // 2. Fallback mapping for common Dhaka neighborhoods.
  const neighborhoodToGodownCode: Record<string, string> = {
    banani: 'GDN-TEJ-01',
    gulshan: 'GDN-TEJ-01',
    tejgaon: 'GDN-TEJ-01',
    mohakhali: 'GDN-TEJ-01',
    niketon: 'GDN-TEJ-01',
    baridhara: 'GDN-TEJ-01',

    mirpur: 'GDN-MIR-02',
    pallabi: 'GDN-MIR-02',
    kafrul: 'GDN-MIR-02',
    kazipara: 'GDN-MIR-02',
    shewrapara: 'GDN-MIR-02',

    uttara: 'GDN-UTT-03',
    airport: 'GDN-UTT-03',
    khilkhet: 'GDN-UTT-03',
    dakshinkhan: 'GDN-UTT-03',

    dhanmondi: 'GDN-DHN-04',
    mohammadpur: 'GDN-DHN-04',
    lalmatia: 'GDN-DHN-04',
    kalabagan: 'GDN-DHN-04',

    sadarghat: 'GDN-OLD-05',
    olddhaka: 'GDN-OLD-05',
    lalbagh: 'GDN-OLD-05',
  };

  const normalizedAddress = cleanText(customerAddress);

  for (const [keyword, code] of Object.entries(
    neighborhoodToGodownCode
  )) {
    if (!areaMatches(normalizedAddress, keyword)) {
      continue;
    }

    const matched = godowns.find(
      (g) => g.code === code || g.id === code
    );

    if (!matched) {
      continue;
    }

    if (matched.status !== 'ACTIVE') {
      return {
        godown: matched,
        isInactive: true,
        requiresManualRouting: true,
        reason:
          `Designated local godown "${matched.name}" is INACTIVE. ` +
          `Manual routing required.`,
      };
    }

    return {
      godown: matched,
      isInactive: false,
      requiresManualRouting: false,
    };
  }

  // Avoid silently selecting a godown when the address
  // cannot be matched with certainty.
  return {
    requiresManualRouting: true,
    reason:
      `No suitable active local godown could be identified for ` +
      `address "${customerAddress}" in "${cityClean || customerCity}". ` +
      `Shipment placed in the manual routing queue.`,
  };
}

/**
 * Automatically assigns an eligible delivery partner after
 * the Local Godown Manager accepts a shipment.
 *
 * Rules:
 * 1. Partner account must be APPROVED.
 * 2. Partner must have delivery permission.
 * 3. Partner must serve the customer's area or address.
 * 4. Partner must have fewer than 8 active jobs.
 * 5. Prefer the lowest workload, then the highest rating.
 */
export function autoAssignDeliveryPartner(
  customerArea: string,
  customerAddress: string,
  partners: DeliveryPartner[]
): DeliveryPartnerAssignmentResult {
  // Consider both the area and the full address.
  // This avoids relying exclusively on the godown service area.
  const targets = [customerArea, customerAddress].filter(
    (value): value is string =>
      typeof value === 'string' && value.trim().length > 0
  );

  if (targets.length === 0) {
    return {
      isSuccess: false,
      eligibleCandidatesCount: 0,
      reason:
        'Customer delivery area and address are both empty. ' +
        'Shipment queued for manual assignment.',
    };
  }

  // Filter partners according to eligibility rules.
  const eligiblePartners = partners.filter((partner) => {
    // Rule 1: Partner must be approved.
    if (partner.approvalStatus !== 'APPROVED') {
      return false;
    }

    // Rule 2: Partner must have delivery permission.
    if (partner.canDeliver !== true) {
      return false;
    }

    // Rule 3: Validate active job count and capacity.
    const activeJobs = Number(partner.activeJobsCount ?? 0);

    if (
      !Number.isFinite(activeJobs) ||
      activeJobs < 0 ||
      activeJobs >= 8
    ) {
      return false;
    }

    // Rule 4: Partner must serve at least one supplied target.
    const assignedAreas = Array.isArray(partner.assignedAreas)
      ? partner.assignedAreas
      : [];

    const preferredArea =
      typeof partner.preferredArea === 'string'
        ? partner.preferredArea
        : '';

    const servesCustomer = targets.some((target) => {
      const matchesAssignedArea = assignedAreas.some(
        (area) =>
          typeof area === 'string' &&
          areaMatches(target, area)
      );

      const matchesPreferredArea =
        preferredArea.length > 0 &&
        areaMatches(target, preferredArea);

      return matchesAssignedArea || matchesPreferredArea;
    });

    return servesCustomer;
  });

  // No eligible partner: leave the shipment for manual assignment.
  if (eligiblePartners.length === 0) {
    return {
      isSuccess: false,
      eligibleCandidatesCount: 0,
      reason:
        `No approved delivery partner with available capacity ` +
        `was found for area "${customerArea}" or address ` +
        `"${customerAddress}". Shipment queued for manual assignment.`,
    };
  }

  // Rule 5: Lowest workload first; highest rating breaks ties.
  eligiblePartners.sort((a, b) => {
    const jobsA = Number(a.activeJobsCount ?? 0);
    const jobsB = Number(b.activeJobsCount ?? 0);

    if (jobsA !== jobsB) {
      return jobsA - jobsB;
    }

    return (
      (Number(b.rating) || 0) -
      (Number(a.rating) || 0)
    );
  });

  const selectedPartner = eligiblePartners[0];

  return {
    partner: selectedPartner,
    isSuccess: true,
    eligibleCandidatesCount: eligiblePartners.length,
    reason:
      `Assigned partner ${selectedPartner.name} ` +
      `(Active Jobs: ${selectedPartner.activeJobsCount ?? 0}, ` +
      `Rating: ${selectedPartner.rating ?? 0}★, ` +
      `Vehicle: ${selectedPartner.vehicleType}).`,
  };
}