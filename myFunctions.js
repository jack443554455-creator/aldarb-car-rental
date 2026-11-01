/* myFunctions.js - جميع التوابع البرمجية للموقع في ملف واحد */

var DISCOUNT_LIMIT_DAYS = 10;   // الحد الذي يبدأ بعده الخصم
var DISCOUNT_RATE = 0.05;       // نسبة الخصم 5%
var MS_PER_DAY = 24 * 60 * 60 * 1000;

/* ---------- أدوات مساعدة ---------- */

// تنسيق المبلغ بفواصل الآلاف مع كلمة ل.س
function formatMoney(value) {
    var text = String(Math.round(value));
    var result = "";
    var count = 0;
    for (var i = text.length - 1; i >= 0; i--) {
        result = text.charAt(i) + result;
        count++;
        if (count % 3 === 0 && i !== 0) {
            result = "," + result;
        }
    }
    return result + " ل.س";
}

// التحقق أن النص تاريخ حقيقي بصيغة yyyy-mm-dd
function isValidDate(text) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        return false;
    }
    var parts = text.split("-");
    var y = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10);
    var d = parseInt(parts[2], 10);
    var date = new Date(y, m - 1, d);
    return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

// عدد الأيام بين تاريخين (yyyy-mm-dd)
function daysBetween(startText, endText) {
    var s = startText.split("-");
    var e = endText.split("-");
    var start = Date.UTC(parseInt(s[0], 10), parseInt(s[1], 10) - 1, parseInt(s[2], 10));
    var end = Date.UTC(parseInt(e[0], 10), parseInt(e[1], 10) - 1, parseInt(e[2], 10));
    return Math.round((end - start) / MS_PER_DAY);
}

/* ---------- دوال التحقق (تعيد نص الخطأ أو نصاً فارغاً عند الصحة) ---------- */

// الاسم: أحرف عربية ومسافات فقط، ويقبل الفراغ
function checkName(value) {
    if (value === "") {
        return "";
    }
    if (!/^[\u0621-\u064A\u0671\u067E\u0686\u0698\u06A9\u06AF\u06CC ]+$/.test(value)) {
        return "الاسم يجب أن يحتوي أحرفاً عربية فقط";
    }
    return "";
}

// الرقم الوطني: 11 خانة، أول خانتين محافظة من 01 إلى 14
function checkNationalId(value) {
    if (value === "") {
        return "الرقم الوطني إلزامي";
    }
    if (!/^\d{11}$/.test(value)) {
        return "الرقم الوطني يجب أن يتكون من 11 رقماً";
    }
    var province = parseInt(value.substring(0, 2), 10);
    if (province < 1 || province > 14) {
        return "أول خانتين (المحافظة) يجب أن تكونا بين 01 و 14";
    }
    return "";
}

// الموبايل: Syriatel (093, 098, 099) أو MTN (094, 095, 096)
function checkMobile(value) {
    if (value === "") {
        return "";
    }
    if (!/^(09|\+9639|009639)(3|4|5|6|8|9)\d{7}$/.test(value)) {
        return "رقم غير مطابق لشبكتي Syriatel أو MTN";
    }
    return "";
}

// البريد الإلكتروني
function checkEmail(value) {
    if (value === "") {
        return "";
    }
    if (!/^[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(\.[A-Za-z0-9\-]+)*\.[A-Za-z]{2,}$/.test(value)) {
        return "صيغة البريد الإلكتروني غير صحيحة";
    }
    return "";
}

function checkStartDate(value) {
    if (value === "") {
        return "تاريخ البداية إلزامي";
    }
    if (!isValidDate(value)) {
        return "التاريخ غير صحيح، الصيغة المطلوبة yyyy-mm-dd";
    }
    return "";
}

function checkEndDate(startValue, endValue) {
    if (endValue === "") {
        return "تاريخ النهاية إلزامي";
    }
    if (!isValidDate(endValue)) {
        return "التاريخ غير صحيح، الصيغة المطلوبة yyyy-mm-dd";
    }
    if (isValidDate(startValue) && daysBetween(startValue, endValue) <= 0) {
        return "تاريخ النهاية يجب أن يكون لاحقاً لتاريخ البداية";
    }
    return "";
}

/* ---------- السيارات المختارة ---------- */

// قراءة السيارات المحددة من الجدول (الرمز، الموديل، السعر)
function getSelectedCars() {
    var cars = [];
    var boxes = document.getElementsByClassName("chk-select");
    for (var i = 0; i < boxes.length; i++) {
        if (boxes[i].checked) {
            var row = boxes[i].parentNode.parentNode;
            var cells = row.getElementsByTagName("td");
            var priceText = cells[4].innerHTML.replace(/[^0-9]/g, "");
            cars.push({
                code: cells[0].innerHTML,
                model: cells[2].innerHTML,
                price: parseInt(priceText, 10)
            });
        }
    }
    return cars;
}

// عرض قائمة السيارات المختارة داخل النموذج
function fillSelectedList(cars) {
    var html = "<ul>";
    for (var i = 0; i < cars.length; i++) {
        html += "<li>" + cars[i].model + " (" + cars[i].code + ") - " + formatMoney(cars[i].price) + " باليوم</li>";
    }
    html += "</ul>";
    document.getElementById("selected-list").innerHTML = html;
}

/* ---------- نافذة النتيجة ---------- */

function showResult(cars, startValue, endValue, fullName) {
    var days = daysBetween(startValue, endValue);
    var total = 0;
    var table = '<tr><th>السيارة</th><th>السعر اليومي</th><th>عدد الأيام</th><th>الإجمالي</th></tr>';
    for (var i = 0; i < cars.length; i++) {
        var carTotal = cars[i].price * days;
        total += carTotal;
        table += "<tr><td>" + cars[i].model + "</td><td>" + formatMoney(cars[i].price) + "</td><td>" + days + "</td><td>" + formatMoney(carTotal) + "</td></tr>";
    }
    var discount = 0;
    if (days > DISCOUNT_LIMIT_DAYS) {
        discount = total * DISCOUNT_RATE;
    }
    var finalAmount = total - discount;

    var sum = '<tr class="total"><td>المجموع قبل الخصم</td><td>' + formatMoney(total) + "</td></tr>";
    if (discount > 0) {
        sum += "<tr><td>الخصم 5% (المدة أكثر من 10 أيام)</td><td>- " + formatMoney(discount) + "</td></tr>";
    } else {
        sum += "<tr><td>الخصم</td><td>لا يوجد (المدة 10 أيام أو أقل)</td></tr>";
    }
    sum += '<tr class="final"><td>المبلغ النهائي</td><td>' + formatMoney(finalAmount) + "</td></tr>";

    var info = "فترة الإيجار من " + startValue + " إلى " + endValue + " (" + days + " يوم)";
    if (fullName !== "") {
        info = "مقدم الطلب: " + fullName + " - " + info;
    }
    document.getElementById("result-info").innerHTML = info;
    document.getElementById("result-table").innerHTML = table;
    document.getElementById("result-sum").innerHTML = sum;
    $("#overlay").fadeIn(200);
    $("#result-box").fadeIn(300);
}

/* ---------- الخروج ---------- */

function exitSite() {
    if (confirm("هل تريد الخروج من الموقع؟")) {
        window.close();
        window.location.href = "about:blank";
    }
}

/* ---------- ربط الأحداث باستخدام jQuery ---------- */

$(document).ready(function () {

    $("#exit-link").click(function (event) {
        event.preventDefault();
        exitSite();
    });

    // إظهار/إخفاء التفاصيل (يمكن إظهار عدة سيارات معاً)
    $(".chk-details").change(function () {
        var row = $("#details-" + $(this).val());
        if (this.checked) {
            row.fadeIn(250);
        } else {
            row.fadeOut(200);
        }
    });

    // زر المتابعة: يظهر النموذج بعد اختيار سيارة
    $("#continue-btn").click(function () {
        var cars = getSelectedCars();
        if (cars.length === 0) {
            $("#select-error").text("الرجاء اختيار سيارة واحدة على الأقل قبل المتابعة");
            $("#booking-form").slideUp(200);
            return;
        }
        $("#select-error").text("");
        fillSelectedList(cars);
        $("#booking-form").slideDown(300);
    });

    // إرسال النموذج مع التحقق من جميع الحقول
    $("#booking-form").submit(function (event) {
        event.preventDefault();
        var name = $.trim($("#full-name").val());
        var id = $.trim($("#national-id").val());
        var mobile = $.trim($("#mobile").val());
        var email = $.trim($("#email").val());
        var start = $.trim($("#start-date").val());
        var end = $.trim($("#end-date").val());

        var errName = checkName(name);
        var errId = checkNationalId(id);
        var errMobile = checkMobile(mobile);
        var errEmail = checkEmail(email);
        var errStart = checkStartDate(start);
        var errEnd = checkEndDate(start, end);

        $("#err-name").text(errName);
        $("#err-id").text(errId);
        $("#err-mobile").text(errMobile);
        $("#err-email").text(errEmail);
        $("#err-start").text(errStart);
        $("#err-end").text(errEnd);

        var allValid = (errName === "" && errId === "" && errMobile === "" &&
                        errEmail === "" && errStart === "" && errEnd === "");
        if (!allValid) {
            return;
        }
        var cars = getSelectedCars();
        if (cars.length === 0) {
            $("#select-error").text("لا توجد سيارة مختارة");
            return;
        }
        showResult(cars, start, end, name);
    });

    $("#close-result, #overlay").click(function () {
        $("#result-box").fadeOut(200);
        $("#overlay").fadeOut(200);
    });
});
