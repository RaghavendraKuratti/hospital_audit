export const generateClaimDraft = (userData, productData) => {
    const { userName, lastFourDigits, bankName } = userData;
    const { productName, purchaseDate, pricePaid, currentPrice, orderId } = productData;
    const refundAmount = pricePaid - currentPrice;

    return `
To: The Claims Department / Nodal Officer, ${bankName} Credit Card Division
Subject: Claim for Price Protection Benefit - Order ID: ${orderId}

Dear Sir/Madam,

I am writing to formally submit a claim under the "Price Protection" benefit provided on my ${bankName} Credit Card (Ending in ${lastFourDigits}).

Details of the Purchase:
- Product Name: ${productName}
- Date of Purchase: ${purchaseDate}
- Platform: Amazon.in / Flipkart
- Original Price Paid: ₹${pricePaid.toLocaleString('en-IN')}
- Current Lower Market Price: ₹${currentPrice.toLocaleString('en-IN')}
- Total Claim Amount: ₹${refundAmount.toLocaleString('en-IN')}

As per the terms of my cardholder agreement, I am eligible for a refund of the price difference if the same product is advertised at a lower price within the 30-day protection window.

Attached to this email, please find:
1. The original invoice for the purchase.
2. A timestamped screenshot of the current lower price on the e-commerce platform.

Kindly process this refund and credit the amount of ₹${refundAmount.toLocaleString('en-IN')} back to my credit card account. 

I look forward to a swift resolution.

Regards,
${userName}
Phone: [Mobile Number]
    `;
};