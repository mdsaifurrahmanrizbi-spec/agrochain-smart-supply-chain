/**
 * AgroChain Logistics and Commission Calculations
 */

export function isInsideDhaka(locationOrAddress: string): boolean {
  if (!locationOrAddress) return true;
  const lower = locationOrAddress.toLowerCase();
  const dhakaKeywords = [
    'dhaka',
    'banani',
    'gulshan',
    'tejgaon',
    'mirpur',
    'dhanmondi',
    'uttara',
    'mohammadpur',
    'motijheel',
    'badda',
    'khilkhet',
    'mohakhali',
    'baridhara',
    'farmgate',
    'shyamoli',
    'rampura',
    'malibagh',
    'basundhara',
    'bashundhara',
  ];
  return dhakaKeywords.some((keyword) => lower.includes(keyword));
}

export interface DeliveryFeeCalculation {
  isDhaka: boolean;
  baseFee: number;
  weightFee: number;
  totalDeliveryFee: number;
  totalWeightKg: number;
}

export function calculateDeliveryFee(
  locationOrAddress: string,
  totalWeightKg: number
): DeliveryFeeCalculation {
  const isDhaka = isInsideDhaka(locationOrAddress);
  const baseFee = isDhaka ? 70 : 130;
  const weight = Math.max(0, Number(totalWeightKg) || 0);

  // If weight <= 0.5 kg: charge only base fee.
  // If weight > 0.5 kg: add ৳10 per kg of the TOTAL shipment weight.
  const weightFee = weight <= 0.5 ? 0 : Math.round(weight * 10);
  const totalDeliveryFee = baseFee + weightFee;

  return {
    isDhaka,
    baseFee,
    weightFee,
    totalDeliveryFee,
    totalWeightKg: weight,
  };
}

export interface CommissionCalculation {
  productSubtotal: number;
  platformCommission: number; // 10%
  sellerNetEarnings: number; // 90%
}

export function calculateCommission(productSubtotal: number): CommissionCalculation {
  const subtotal = Math.max(0, Number(productSubtotal) || 0);
  const platformCommission = Math.round(subtotal * 0.1); // 10%
  const sellerNetEarnings = subtotal - platformCommission;

  return {
    productSubtotal: subtotal,
    platformCommission,
    sellerNetEarnings,
  };
}

export function generateDeliveryOtp(): string {
  // Generate a random 4-digit numeric OTP
  return Math.floor(1000 + Math.random() * 9000).toString();
}
