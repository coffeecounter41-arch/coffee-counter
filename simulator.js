const axios = require('axios');

// الإعدادات
const API_URL = "https://prosense.ly/api/device/sync";
const SERIAL = "smaller"; 
let totalSent = 104; // سنبدأ من 104 بناءً على صورتك الأخيرة للداشبورد

async function sendPulse(cupsToAdd, description) {
    totalSent += cupsToAdd;
    console.log(`\n-----------------------------------------`);
    console.log(`🛠️ [الهاردوير]: يقوم الآن بـ ${description}`);
    console.log(`📡 [إرسال]: العداد الكلي الحالي = ${totalSent} (الزيادة: +${cupsToAdd})`);

    try {
        const startTime = Date.now();
        const response = await axios.post(API_URL, {
            serialNumber: SERIAL,
            totalSent: totalSent,
            wifi: 92,
            ip: "192.168.1.15"
        });
        const duration = Date.now() - startTime;

        console.log(`✅ [استجابة السيرفر] (${duration}ms):`, response.data);

        // تحليل الاستجابة بشكل ذكي
        if (response.data.status === "success") {
            console.log(`📊 [تحليل النظام]:`);
            console.log(`   - تم إضافة ${response.data.added} كوب/أكواب بنجاح.`);
            if (cupsToAdd === 1) console.log(`   - تم تصنيفها كـ [Single Shot] ☕`);
            if (cupsToAdd === 2) console.log(`   - تم تصنيفها كـ [Double Shot] ☕☕`);
            if (cupsToAdd > 2) console.log(`   - تم تصنيفها كـ [Mixed/Bulk] 📦`);
        }

        if (response.data.command === "RESET_NOW") {
            console.log("⚠️ [أمر هام]: السيرفر يطلب التصفير (RESET_NOW)!");
            console.log("   - المنطق: الأدمن ضغط زر التصفير، يجب تصفير عداد الوردية داخلياً.");
        }

    } catch (error) {
        console.error("❌ [خطأ في الاتصال]:", error.response?.data || error.message);
    }
}

async function runSmartTest() {
    console.log("🚀 بدء اختبار المحاكي الذكي على جهاز: " + SERIAL);
    console.log("📍 العداد الحالي في قاعدة البيانات يُفترض أن يكون: 104");

    // 1. اختبار السنغل (Single)
    await sendPulse(1, "عمل قهوة فردية (Single)");

    // 2. اختبار الدبل (Double)
    setTimeout(async () => {
        await sendPulse(2, "عمل قهوة مضاعفة (Double)");
    }, 3000);

    // 3. اختبار التراكم السريع (مثلاً ضغط العميل سنغل مرتين بسرعة)
    setTimeout(async () => {
        await sendPulse(1, "عمل قهوة فردية سريعة");
    }, 6000);
}

runSmartTest();