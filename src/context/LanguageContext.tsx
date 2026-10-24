import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export type AppLanguage = 'bn' | 'en';
type LanguageContextValue = { language: AppLanguage; setLanguage: (language: AppLanguage) => void; t: (english: string) => string; voiceLocale: 'bn-BD' | 'en-US' };
const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);
const STORAGE_KEY = 'agrochain-language';

const translations: Record<string, string> = {
  'Agricultural Marketplace':'কৃষিপণ্য বাজার',
  'Supply Chain Process':'সরবরাহ শৃঙ্খল প্রক্রিয়া',
  'About Platform':'প্ল্যাটফর্ম সম্পর্কে',
  'Regional Hubs':'আঞ্চলিক কেন্দ্র',
  'View Cart':'কার্ট দেখুন',
  'Sign In':'সাইন ইন',
  'Sign Up':'নিবন্ধন করুন',
  'Register':'নিবন্ধন',
  'Login':'লগইন',
  'Email':'ইমেইল',
  'Password':'পাসওয়ার্ড',
  'Full Name':'পুরো নাম',
  'Phone Number':'ফোন নম্বর',
  'Language':'ভাষা',
  'English':'ইংরেজি',
  'বাংলা':'বাংলা',
  'Choose language':'ভাষা নির্বাচন করুন',
  'Dashboard':'ড্যাশবোর্ড',
  'Profile':'প্রোফাইল',
  'Settings':'সেটিংস',
  'Save Changes':'পরিবর্তন সংরক্ষণ করুন',
  'Save':'সংরক্ষণ',
  'Cancel':'বাতিল',
  'Verifying session...':'সেশন যাচাই করা হচ্ছে...',
  'My Farms':'আমার খামার',
  'Crops & Varieties':'ফসল ও জাত',
  'My Products':'আমার পণ্য',
  'My Batches':'আমার ব্যাচ',
  'Agriculture':'কৃষি',
  'Fresh Produce':'তাজা কৃষিপণ্য',
  'Farm to Market':'খামার থেকে বাজারে',
  'Farmers':'কৃষকগণ',
  'Customers':'ক্রেতাগণ',
  'Get Started Today':'আজই শুরু করুন',
  'Discover Fresh Produce':'তাজা কৃষিপণ্য খুঁজুন',
  'Shop Now':'এখনই কিনুন',
  'Explore Products':'পণ্য দেখুন',
  'Welcome to AgroChain':'AgroChain-এ স্বাগতম',
  'Your trusted agricultural marketplace':'আপনার বিশ্বস্ত কৃষিপণ্যের বাজার',
  'Sign in to your account':'আপনার অ্যাকাউন্টে সাইন ইন করুন',
  'Create your account':'আপনার অ্যাকাউন্ট তৈরি করুন',
  'Enter your email':'আপনার ইমেইল লিখুন',
  'Enter your password':'আপনার পাসওয়ার্ড লিখুন',
  'Enter full name':'পুরো নাম লিখুন',
  'Enter phone number':'ফোন নম্বর লিখুন',
  'Enter your phone number':'আপনার ফোন নম্বর লিখুন',
  'Enter address':'ঠিকানা লিখুন',
  'Select your role':'আপনার ভূমিকা নির্বাচন করুন',
  'Choose your role':'আপনার ভূমিকা বেছে নিন',
  'I agree to the Terms and Conditions':'আমি শর্তাবলিতে সম্মত',
  'Don\'t have an account?':'অ্যাকাউন্ট নেই?',
  'Already have an account?':'ইতোমধ্যে অ্যাকাউন্ট আছে?',
  'Please wait...':'অনুগ্রহ করে অপেক্ষা করুন...',
  'Please try again.':'অনুগ্রহ করে আবার চেষ্টা করুন।',
  'Something went wrong.':'কিছু একটা সমস্যা হয়েছে।',
  'Network error':'নেটওয়ার্কে সমস্যা',
  'Connection failed':'সংযোগ ব্যর্থ হয়েছে',
  'Success':'সফল',
  'Error':'ত্রুটি',
  'Warning':'সতর্কতা',
  'Order placed successfully':'অর্ডার সফলভাবে সম্পন্ন হয়েছে',
  'Payment successful':'পেমেন্ট সফল হয়েছে',
  'Payment failed':'পেমেন্ট ব্যর্থ হয়েছে',
  'No notifications':'কোনো বিজ্ঞপ্তি নেই',
  'No records found':'কোনো রেকর্ড পাওয়া যায়নি',
  'No users found':'কোনো ব্যবহারকারী পাওয়া যায়নি',
  'Select payment method':'পেমেন্ট পদ্ধতি নির্বাচন করুন',
  'Select a category':'বিভাগ নির্বাচন করুন',
  'Select a product':'পণ্য নির্বাচন করুন',
  'Delivery Address':'ডেলিভারি ঠিকানা',
  'Shipping Address':'শিপিং ঠিকানা',
  'Billing Address':'বিলিং ঠিকানা',
  'Order Summary':'অর্ডারের সারাংশ',
  'Subtotal':'উপমোট',
  'Delivery Fee':'ডেলিভারি ফি',
  'Grand Total':'সর্বমোট',
  'Place Order':'অর্ডার নিশ্চিত করুন',
  'Proceed to Checkout':'চেকআউটে যান',
  'Continue Shopping':'কেনাকাটা চালিয়ে যান',
  'Add to Cart':'কার্টে যোগ করুন',
  'Remove from Cart':'কার্ট থেকে সরান',
  'Update Quantity':'পরিমাণ আপডেট করুন',
  'Track Order':'অর্ডার ট্র্যাক করুন',
  'Order Tracking':'অর্ডার ট্র্যাকিং',
  'Estimated Delivery':'সম্ভাব্য ডেলিভারি',
  'Delivery Status':'ডেলিভারির অবস্থা',
  'Payment Details':'পেমেন্টের বিবরণ',
  'Transaction ID':'লেনদেন আইডি',
  'Reference Number':'রেফারেন্স নম্বর',
  'Refund':'ফেরত',
  'Farm Details':'খামারের বিবরণ',
  'Crop Details':'ফসলের বিবরণ',
  'Product Details':'পণ্যের বিবরণ',
  'Batch Details':'ব্যাচের বিবরণ',
  'Add New':'নতুন যোগ করুন',
  'Create New':'নতুন তৈরি করুন',
  'Update Details':'বিবরণ আপডেট করুন',
  'Save Settings':'সেটিংস সংরক্ষণ করুন',
  'Personal Information':'ব্যক্তিগত তথ্য',
  'Contact Information':'যোগাযোগের তথ্য',
  'Account Information':'অ্যাকাউন্টের তথ্য',
  'Security':'নিরাপত্তা',
  'Change Password':'পাসওয়ার্ড পরিবর্তন করুন',
  'Current Password':'বর্তমান পাসওয়ার্ড',
  'New Password':'নতুন পাসওয়ার্ড',
  'Confirm New Password':'নতুন পাসওয়ার্ড নিশ্চিত করুন',
  'Profile Settings':'প্রোফাইল সেটিংস',
  'Language Settings':'ভাষার সেটিংস',
  'Choose Language':'ভাষা বেছে নিন',
  'English (US)':'ইংরেজি (যুক্তরাষ্ট্র)',
  'Bangla':'বাংলা',
  'Bengali':'বাংলা',
  'Delivery Partner':'ডেলিভারি পার্টনার',
  'Quality Inspector':'মান পরিদর্শক',
  'Warehouse Manager':'গুদাম ব্যবস্থাপক',
  'Admin Dashboard':'অ্যাডমিন ড্যাশবোর্ড',
  'QC Inspector':'মান পরিদর্শক',
  'Inspection Status':'পরিদর্শনের অবস্থা',
  'Audit Details':'অডিটের বিবরণ',
  'Inspection Notes':'পরিদর্শনের নোট',
  'Quality Score':'মানের স্কোর',
  'Approve Batch':'ব্যাচ অনুমোদন করুন',
  'Manage Products':'পণ্য পরিচালনা করুন',
  'Manage Orders':'অর্ডার পরিচালনা করুন',
  'Manage Users':'ব্যবহারকারী পরিচালনা করুন',
  'Manage Inventory':'মজুত পরিচালনা করুন',
  'Manage Deliveries':'ডেলিভারি পরিচালনা করুন',
  'Manage Payments':'পেমেন্ট পরিচালনা করুন',
  'Platform Overview':'প্ল্যাটফর্মের সারসংক্ষেপ',
  'Total Sales':'মোট বিক্রয়',
  'Total Orders':'মোট অর্ডার',
  'Total Users':'মোট ব্যবহারকারী',
  'Total Products':'মোট পণ্য',
  'Total Revenue':'মোট আয়',
  'Net Revenue':'নিট আয়',
  'Monthly Sales':'মাসিক বিক্রয়',
  'Weekly Sales':'সাপ্তাহিক বিক্রয়',
  'Performance':'কার্যকারিতা',
  'Analytics':'বিশ্লেষণ',
  'Statistics':'পরিসংখ্যান',
  'No description available':'কোনো বিবরণ নেই',
  'View More':'আরও দেখুন',
  'Show More':'আরও দেখান',
  'Show Less':'কম দেখান',
  'Previous':'পূর্ববর্তী',
  'First':'প্রথম',
  'Last':'শেষ',
  'Page':'পৃষ্ঠা',
  'of':'এর মধ্যে',
  'Results':'ফলাফল',
  'Search by keyword':'কীওয়ার্ড দিয়ে খুঁজুন',
  'Start date':'শুরুর তারিখ',
  'End date':'শেষ তারিখ',
  'From':'থেকে',
  'To':'পর্যন্ত',
  'Sort by':'সাজান',
  'Newest First':'নতুন আগে',
  'Oldest First':'পুরোনো আগে',
  'Low to High':'কম থেকে বেশি',
  'High to Low':'বেশি থেকে কম',
  'Ascending':'ঊর্ধ্বক্রম',
  'Descending':'নিম্নক্রম',
  'Orders & Sales':'অর্ডার ও বিক্রয়',
  'Tracking':'ট্র্যাকিং',
  'Payments & Payouts':'পেমেন্ট ও পাওনা',
  'Reports & Analytics':'রিপোর্ট ও বিশ্লেষণ',
  'Customer Dashboard':'ক্রেতা ড্যাশবোর্ড',
  'Farmer Dashboard':'কৃষক ড্যাশবোর্ড',
  'Delivery Dashboard':'ডেলিভারি ড্যাশবোর্ড',
  'Warehouse Dashboard':'গুদাম ড্যাশবোর্ড',
  'My Orders':'আমার অর্ডার',
  'Order History':'অর্ডারের ইতিহাস',
  'My Profile':'আমার প্রোফাইল',
  'Edit Profile':'প্রোফাইল সম্পাদনা',
  'System Settings':'সিস্টেম সেটিংস',
  'User Directory':'ব্যবহারকারী তালিকা',
  'Executive Dashboard':'এক্সিকিউটিভ ড্যাশবোর্ড',
  'Quality Control Audits':'মান নিয়ন্ত্রণ নিরীক্ষা',
  'Quality Checks':'মান যাচাই',
  'Partner Approvals':'পার্টনার অনুমোদন',
  'Delivery Partners':'ডেলিভারি পার্টনার',
  'Warehouse Partners':'গুদাম পার্টনার',
  'Service Areas':'সেবা এলাকা',
  'Logistics':'পরিবহন ব্যবস্থাপনা',
  'Seller Payments':'বিক্রেতার পেমেন্ট',
  'Search...':'খুঁজুন...',
  'Search users...':'ব্যবহারকারী খুঁজুন...',
  'Search orders...':'অর্ডার খুঁজুন...',
  'Search by name or email...':'নাম বা ইমেইল দিয়ে খুঁজুন...',
  'Filter':'ফিল্টার',
  'Filters':'ফিল্টারসমূহ',
  'All':'সব',
  'All Statuses':'সব অবস্থা',
  'All Roles':'সব ভূমিকা',
  'All Orders':'সব অর্ডার',
  'Add Product':'পণ্য যোগ করুন',
  'Add Crop':'ফসল যোগ করুন',
  'Create Order':'অর্ডার তৈরি করুন',
  'Order Details':'অর্ডারের বিবরণ',
  'Product Name':'পণ্যের নাম',
  'Crop Name':'ফসলের নাম',
  'Quantity':'পরিমাণ',
  'Price':'দাম',
  'Total':'মোট',
  'Date':'তারিখ',
  'Time':'সময়',
  'Description':'বিবরণ',
  'Category':'বিভাগ',
  'Unit':'একক',
  'Weight':'ওজন',
  'Harvest Date':'ফসল কাটার তারিখ',
  'Expiry Date':'মেয়াদ শেষের তারিখ',
  'Customer Name':'ক্রেতার নাম',
  'Farmer Name':'কৃষকের নাম',
  'Order ID':'অর্ডার আইডি',
  'Payment Method':'পেমেন্ট পদ্ধতি',
  'Payment Status':'পেমেন্টের অবস্থা',
  'Cash on Delivery':'ক্যাশ অন ডেলিভারি',
  'Online Payment':'অনলাইন পেমেন্ট',
  'Paid':'পরিশোধিত',
  'Unpaid':'অপরিশোধিত',
  'Processing':'প্রক্রিয়াধীন',
  'Completed':'সম্পন্ন',
  'Rejected':'প্রত্যাখ্যাত',
  'Active':'সক্রিয়',
  'Inactive':'নিষ্ক্রিয়',
  'Pending Approval':'অনুমোদনের অপেক্ষায়',
  'View Details':'বিস্তারিত দেখুন',
  'View All':'সব দেখুন',
  'View':'দেখুন',
  'Edit':'সম্পাদনা',
  'Delete':'মুছে ফেলুন',
  'Update':'আপডেট',
  'Refresh':'রিফ্রেশ',
  'Download':'ডাউনলোড',
  'Export':'এক্সপোর্ট',
  'Apply':'প্রয়োগ করুন',
  'Clear':'মুছে দিন',
  'Clear Filters':'ফিল্টার মুছুন',
  'No data found':'কোনো তথ্য পাওয়া যায়নি',
  'No results found':'কোনো ফলাফল পাওয়া যায়নি',
  'Try again':'আবার চেষ্টা করুন',
  'Something went wrong':'কিছু একটা সমস্যা হয়েছে',
  'First Name':'নামের প্রথম অংশ',
  'Last Name':'নামের শেষ অংশ',
  'Confirm Password':'পাসওয়ার্ড নিশ্চিত করুন',
  'Remember me':'আমাকে মনে রাখুন',
  'Forgot Password?':'পাসওয়ার্ড ভুলে গেছেন?',
  'Create Account':'অ্যাকাউন্ট তৈরি করুন',
  'Don’t have an account?':'অ্যাকাউন্ট নেই?',
  'Welcome back':'আবারও স্বাগতম',
  'Select Role':'ভূমিকা নির্বাচন করুন',
  'Select District':'জেলা নির্বাচন করুন',
  'Select...':'নির্বাচন করুন...',
  'Choose file':'ফাইল নির্বাচন করুন',
  'Notifications':'বিজ্ঞপ্তি',
  'Mark all as read':'সব পড়া হয়েছে হিসেবে চিহ্নিত করুন',
  'Help & Support':'সহায়তা ও সাপোর্ট',
  'My Account':'আমার অ্যাকাউন্ট',
  'Sign out':'সাইন আউট',
  'Verifications':'যাচাইকরণ',
  'Inspection History':'পরিদর্শনের ইতিহাস',
  'Assignments':'দায়িত্বসমূহ',
  'Inspections':'পরিদর্শন',
  'Inventory':'মজুত',
  'Stock':'স্টক',
  'Warehouse Management':'গুদাম ব্যবস্থাপনা',
  'Overview':'সারসংক্ষেপ',
  'Recent Orders':'সাম্প্রতিক অর্ডার',
  'Recent Activity':'সাম্প্রতিক কার্যক্রম',
  'Sales':'বিক্রয়',
  'Revenue':'আয়',
  'Commission':'কমিশন',
  'Payout':'পেমেন্ট',
  'Farmer Payout':'কৃষকের পাওনা',
  'Marketplace':'বাজার',
  'Traceability':'পণ্য অনুসরণ',
  'Batch Traceability':'ব্যাচ ট্রেসেবিলিটি',
  'How It Works':'যেভাবে কাজ করে',
  'Get Started':'শুরু করুন',
  'Learn More':'আরও জানুন',
  'Contact Us':'যোগাযোগ করুন',
  'About Us':'আমাদের সম্পর্কে',
  'Frequently Asked Questions':'সাধারণ জিজ্ঞাসা',
  'Terms & Conditions':'শর্তাবলি',
  'Privacy Policy':'গোপনীয়তা নীতি',
  'Choose an option':'একটি বিকল্প নির্বাচন করুন',
  'Required':'আবশ্যক',
  'Optional':'ঐচ্ছিক',
  'Upload Image':'ছবি আপলোড করুন',
  'Upload Document':'ডকুমেন্ট আপলোড করুন',
  'Submit for Approval':'অনুমোদনের জন্য জমা দিন',
  'Approve':'অনুমোদন করুন',
  'Reject':'প্রত্যাখ্যান করুন',
  'Approve Request':'অনুরোধ অনুমোদন করুন',
  'Reject Request':'অনুরোধ প্রত্যাখ্যান করুন',
  'Pending':'অপেক্ষমাণ',
  'Approved':'অনুমোদিত',
  'Cancelled':'বাতিল',
  'Failed':'ব্যর্থ',
  'Today':'আজ',
  'Yesterday':'গতকাল',
  'This Week':'এই সপ্তাহ',
  'This Month':'এই মাস',
  'Start Date':'শুরুর তারিখ',
  'End Date':'শেষ তারিখ',
  'No orders yet':'এখনো কোনো অর্ডার নেই',
  'No products found':'কোনো পণ্য পাওয়া যায়নি',
  'Loading':'লোড হচ্ছে',
  'Loading...':'লোড হচ্ছে...',
  'Try a different search':'অন্যভাবে খুঁজে দেখুন',
  'Showing':'দেখানো হচ্ছে',
  'items':'টি আইটেম',
  'per page':'প্রতি পৃষ্ঠায়',
  'Search':'খুঁজুন',
  'Search products...':'পণ্য খুঁজুন...',
  'Search products':'পণ্য খুঁজুন',
  'Products':'পণ্য',
  'Orders':'অর্ডার',
  'Payments':'পেমেন্ট',
  'Reports':'রিপোর্ট',
  'Farmer':'কৃষক',
  'Customer':'ক্রেতা',
  'Warehouse':'গুদাম',
  'Admin':'অ্যাডমিন',
  'Logout':'লগআউট',
  'Log Out':'লগআউট',
  'Welcome':'স্বাগতম',
  'Home':'হোম',
  'Contact':'যোগাযোগ',
  'About':'আমাদের সম্পর্কে',
  'Submit':'জমা দিন',
  'Continue':'চালিয়ে যান',
  'Back':'পেছনে',
  'Next':'পরবর্তী',
  'Status':'অবস্থা',
  'Name':'নাম',
  'Location':'অবস্থান',
  'Address':'ঠিকানা',
  'District':'জেলা',
  'Phone':'ফোন',
  'Update Profile':'প্রোফাইল আপডেট করুন',
  'System Architecture & Backend Settings':'সিস্টেম আর্কিটেকচার ও ব্যাকএন্ড সেটিংস',
  'Farmer Profile & Payout Settings':'কৃষক প্রোফাইল ও পেমেন্ট সেটিংস',
  'Manage your verified farmer identity and settlement mobile banking accounts.':'আপনার যাচাইকৃত কৃষক পরিচয় ও পেমেন্টের মোবাইল ব্যাংকিং অ্যাকাউন্ট পরিচালনা করুন।',
  'Voice to Text':'ভয়েস থেকে লেখা',
  'Start Listening':'শোনা শুরু করুন',
  'Stop Listening':'শোনা বন্ধ করুন',
  'Listening...':'শোনা হচ্ছে...'
};

export const LanguageProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const originalTextRef = useRef(new WeakMap<Text, string>());
  const originalAttributesRef = useRef(new WeakMap<Element, Map<string, string>>());
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    try { return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : localStorage.getItem(STORAGE_KEY) === 'bn' ? 'bn' : 'en'; }
    catch { return 'en'; }
  });
  const setLanguage = useCallback((next: AppLanguage) => {
    setLanguageState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* storage can be unavailable */ }
  }, []);
  useEffect(() => {
    document.documentElement.lang = language === 'bn' ? 'bn' : 'en';
    const originalText = originalTextRef.current;
    const originalAttributes = originalAttributesRef.current;
    const translateElement = (root: Node) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const textNode = node as Text;
        const parent = textNode.parentElement;
        if (!parent || parent.closest('script,style,textarea,[data-no-translate],.notranslate')) continue;
        if (!originalText.has(textNode)) originalText.set(textNode, textNode.nodeValue || '');
        const original = originalText.get(textNode) || '';
        const trimmed = original.trim();
        if (!trimmed) continue;
        const translated = language === 'bn' ? (translations[trimmed] || trimmed) : trimmed;
        if (textNode.nodeValue !== (original === trimmed ? translated : original.replace(trimmed, translated))) {
          textNode.nodeValue = original === trimmed ? translated : original.replace(trimmed, translated);
        }
      }
      if (root instanceof Element) {
        const attrs = ['placeholder', 'title', 'aria-label'];
        let saved = originalAttributes.get(root);
        if (!saved) { saved = new Map<string, string>(); originalAttributes.set(root, saved); }
        attrs.forEach((attr) => {
          const current = root.getAttribute(attr);
          if (current === null) return;
          if (!saved!.has(attr)) saved!.set(attr, current);
          const original = saved!.get(attr) || current;
          const translated = language === 'bn' ? (translations[original] || original) : original;
          if (current !== translated) root.setAttribute(attr, translated);
        });
      }
      if (root instanceof Element || root instanceof Document) {
        const elements = root instanceof Document ? Array.from(root.body.querySelectorAll('*')) : Array.from(root.querySelectorAll('*'));
        elements.forEach((element) => {
          const saved = originalAttributes.get(element) || new Map<string, string>();
          const attrs = ['placeholder', 'title', 'aria-label'];
          attrs.forEach((attr) => {
            const current = element.getAttribute(attr);
            if (current === null) return;
            if (!saved.has(attr)) saved.set(attr, current);
            const original = saved.get(attr) || current;
            const translated = language === 'bn' ? (translations[original] || original) : original;
            if (current !== translated) element.setAttribute(attr, translated);
          });
          originalAttributes.set(element, saved);
        });
      }
    };
    translateElement(document);
    const observer = new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            const textNode = node as Text;
            if (!originalText.has(textNode)) originalText.set(textNode, textNode.nodeValue || '');
            const original = originalText.get(textNode) || '';
            const trimmed = original.trim();
            if (trimmed && language === 'bn' && translations[trimmed] && textNode.parentElement && !textNode.parentElement.closest('script,style,textarea,[data-no-translate],.notranslate')) {
              const translated = original === trimmed ? translations[trimmed] : original.replace(trimmed, translations[trimmed]);
              if (textNode.nodeValue !== translated) textNode.nodeValue = translated;
            }
          } else if (node.nodeType === Node.ELEMENT_NODE) translateElement(node);
        });
        if (record.type === 'attributes' && record.target instanceof Element) translateElement(record.target);
        if (record.type === 'characterData' && record.target instanceof Text) {
          const textNode = record.target;
          if (!originalText.has(textNode)) originalText.set(textNode, textNode.nodeValue || '');
          const original = originalText.get(textNode) || '';
          const trimmed = original.trim();
          if (trimmed && textNode.parentElement && !textNode.parentElement.closest('script,style,textarea,[data-no-translate],.notranslate')) {
            const translated = language === 'bn' ? (original === trimmed ? (translations[trimmed] || trimmed) : original.replace(trimmed, translations[trimmed] || trimmed)) : original;
            if (textNode.nodeValue !== translated) textNode.nodeValue = translated;
          }
        }
      });
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title', 'aria-label'] });
    return () => observer.disconnect();
  }, [language]);
  const value = useMemo<LanguageContextValue>(() => ({
    language, setLanguage, t: (english: string) => language === 'en' ? english : (translations[english] || english),
    voiceLocale: language === 'bn' ? 'bn-BD' : 'en-US'
  }), [language, setLanguage]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
export const useLanguage = (): LanguageContextValue => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
};
