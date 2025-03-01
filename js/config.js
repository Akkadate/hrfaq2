
/**
 * ไฟล์การตั้งค่าสำหรับระบบ FAQ
 * ไฟล์นี้จะรวมการตั้งค่าต่างๆ ของระบบไว้ในที่เดียว
 */

// การตั้งค่า Supabase
const CONFIG = {
    // API Configuration
    supabase: {
        url: 'https://ecpbvoijdtgkaabuglmw.supabase.co',
        key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjcGJ2b2lqZHRna2FhYnVnbG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4MzkzMDEsImV4cCI6MjA1NjQxNTMwMX0.391_WbnnNWxAB55h5Br4gfFu4c3m65o9x-XPIx4R-WA',
        table: 'faq',
    },
    
    // API Timeout in milliseconds
    apiTimeout: 5000,
    
    // Cache settings
    cache: {
        enabled: true,
        duration: 86400000, // 24 hours in milliseconds
        storageKeys: {
            faqData: 'faqData',
            faqDataTime: 'faqDataTime'
        }
    },
    
    // เพิ่มรายละเอียดไอคอนสำหรับแต่ละหมวดหมู่
    groupIcons: {
        "การลางาน": "fas fa-calendar-alt",
        "เงินเดือนและสวัสดิการ": "fas fa-money-bill-wave",
        "ข้อมูลส่วนตัว": "fas fa-user-edit",
        "ความปลอดภัยและการเข้าสู่ระบบ": "fas fa-shield-alt"
    },
    
    // Default group icon
    defaultGroupIcon: "fas fa-folder",
    
    // App version
    version: '1.0.0',
    
    // Last updated date
    lastUpdated: '1 Mar 2025'
};
