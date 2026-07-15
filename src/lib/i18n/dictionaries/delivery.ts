const dict = {
  en: {
    portalSubtitle: 'Delivery Verification Portal',
    confirmDeliveryHeading: 'Confirm Delivery',
    instructions: 'Ask the customer for their 4-digit OTP and enter it below along with the Order ID shown on the package.',
    labelOrderId: 'Order ID (first 8 characters)',
    placeholderOrderId: 'e.g. A1B2C3D4',
    labelOtp: 'Customer OTP',
    successMessage: 'Delivery confirmed successfully! Order marked as delivered.',
    verifyingBtn: 'Verifying…',
    confirmDeliveryBtn: 'Confirm Delivery →',
    footerNote: 'Only for authorized delivery partners · KalaStree',
  },
  hi: {
    portalSubtitle: 'डिलीवरी सत्यापन पोर्टल',
    confirmDeliveryHeading: 'डिलीवरी की पुष्टि करें',
    instructions: 'ग्राहक से उनका 4-अंकों का OTP पूछें और उसे नीचे पैकेज पर लिखे ऑर्डर आईडी के साथ दर्ज करें।',
    labelOrderId: 'ऑर्डर आईडी (पहले 8 अक्षर)',
    placeholderOrderId: 'जैसे: A1B2C3D4',
    labelOtp: 'ग्राहक का OTP',
    successMessage: 'डिलीवरी सफलतापूर्वक पुष्टि की गई! ऑर्डर को डिलीवर के रूप में चिह्नित किया गया।',
    verifyingBtn: 'सत्यापित हो रहा है…',
    confirmDeliveryBtn: 'डिलीवरी की पुष्टि करें →',
    footerNote: 'केवल अधिकृत डिलीवरी पार्टनर्स के लिए · KalaStree',
  },
} as const

export default dict
