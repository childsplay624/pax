import { triggerNotification } from "./src/app/actions/notifications";

async function runTest() {
    console.log("🚀 Starting Multi-Channel Notification Test...");

    const testData = {
        userId: null, // null because we are testing external channels (SMS/WhatsApp)
        data: {
            title: "Test Shipment Alert",
            message: "This is a test notification from PAX.",
            type: "success" as const,
            phone: "08174634585", // REPLACE WITH YOUR ACTUAL NUMBER FOR TESTING
            smsMessage: "PAX Test: Your shipment PAX-123456 is arriving! Track: https://panafricanexpress.ng",
            whatsappMessage: "PAX Test: Your shipment *PAX-123456* is arriving! 📦 Track: https://panafricanexpress.ng",
            emailAddress: "tizanege@gmail.com", // REPLACE WITH YOUR ACTUAL EMAIL
            emailSubject: "PAX Test Notification",
            emailHtml: "<h1>PAX Test</h1><p>Your multi-channel notification is working!</p>"
        }
    };

    console.log("📡 Triggering SMS, WhatsApp, and Email...");

    try {
        await triggerNotification(testData.userId, testData.data);
        console.log("✅ Test request sent to providers.");
    } catch (error) {
        console.error("❌ Test failed:", error);
    }
}

runTest();
