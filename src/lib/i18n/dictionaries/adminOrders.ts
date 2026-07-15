const dict = {
  en: {
    pageTitle: 'Orders',
    noOrdersYet: 'No orders yet.',
    statusLabelColon: 'Status:',
    statusPending: 'PENDING',
    statusPaid: 'PAID',
    statusProcessing: 'PROCESSING',
    statusShipped: 'SHIPPED',
    statusDelivered: 'DELIVERED',
    statusCancelled: 'CANCELLED',
  },
  hi: {
    pageTitle: 'ऑर्डर',
    noOrdersYet: 'अभी तक कोई ऑर्डर नहीं है।',
    statusLabelColon: 'स्थिति:',
    statusPending: 'लंबित',
    statusPaid: 'भुगतान हुआ',
    statusProcessing: 'प्रक्रियाधीन',
    statusShipped: 'भेज दिया गया',
    statusDelivered: 'डिलीवर हो गया',
    statusCancelled: 'रद्द',
  },
} as const

export default dict
