$(document).ready(function() {
    // Konfigurasi Toastr
    toastr.options = {
        closeButton: true,
        progressBar: true,
        positionClass: "toast-top-right",
        timeOut: "5000",
        showDuration: "300",
        hideDuration: "500",
        extendedTimeOut: "1000",
        showEasing: "swing",
        hideEasing: "linear",
        showMethod: "fadeIn",
        hideMethod: "fadeOut"
    };

    // Efek hover tombol
    $("#btnCek").hover(
        function() { $(this).find("svg").addClass("animate-bounce"); },
        function() { $(this).find("svg").removeClass("animate-bounce"); }
    );

    // Event handler untuk tombol dan input
    $("#btnCek").click(cekKuota);
    $("#nomorHp").keypress(function(e) { if (e.which === 13) cekKuota(); });

    // Fungsi loading
    function showLoading() { $("#loading").removeClass("hidden").addClass("flex"); }
    function hideLoading() { $("#loading").removeClass("flex").addClass("hidden"); }

    // Fungsi untuk menghitung sisa kuota
    function calculateRemainingQuota(data) {
        let remainingQuotaBytes = 0;
        const quotas = data.data_sp?.quotas?.value || [];
        quotas.forEach(quota => {
            const details = quota.detail_quota || [];
            details.forEach(detail => {
                const remaining = parseInt(detail.remaining, 10) || 0;
                remainingQuotaBytes += remaining;
            });
        });
        const remainingQuotaGB = remainingQuotaBytes / (1024 * 1024 * 1024);
        return remainingQuotaGB.toFixed(2);
    }

    // Fungsi untuk memilih ikon
    function getQuotaIcon(quotaName, benefit) {
        const nameLower = quotaName.toLowerCase();
        const benefitLower = benefit.toLowerCase();
        if (nameLower.includes("internet") || benefitLower.includes("24jam")) {
            return '<i class="fas fa-globe fa-lg"></i>';
        } else if (nameLower.includes("apps") || benefitLower.includes("apps")) {
            return '<i class="fas fa-mobile-alt fa-lg"></i>';
        } else if (nameLower.includes("bonus") || benefitLower.includes("bonus")) {
            return '<i class="fas fa-gift fa-lg"></i>';
        } else {
            return '<i class="fas fa-box fa-lg"></i>';
        }
    }

    // Fungsi untuk membuat HTML detail kuota
    function renderQuotaDetails(data) {
        const quotas = data.data_sp?.quotas?.value || [];
        let html = '';
        quotas.forEach(quota => {
            const details = quota.detail_quota || [];
            details.forEach(detail => {
                const icon = getQuotaIcon(quota.name, detail.name);
                const remainingQuotaGB = (parseInt(detail.remaining, 10) / (1024 * 1024 * 1024)).toFixed(2);
                const totalQuotaGB = (parseInt(detail.total, 10) / (1024 * 1024 * 1024)).toFixed(2);
                html += `
                    <div class="quota-card rounded-xl p-4 mb-4 shadow-lg">
                        <div class="flex items-center justify-between mb-3">
                            <div class="flex items-center">
                                <div class="icon-circle mr-3">${icon}</div>
                                <h4 class="text-md font-semibold text-gray-800">${quota.name}</h4>
                            </div>
                            <div class="bg-blue-100 text-blue-800 rounded-lg px-2 py-1 text-sm">${remainingQuotaGB} GB</div>
                        </div>
                        <div class="text-sm text-gray-600 space-y-1">
                            <div class="flex items-center">
                                <i class="fas fa-box-open mr-2 text-blue-500"></i>
                                <span>Benefit: ${detail.name}</span>
                            </div>
                            <div class="flex items-center">
                                <i class="fas fa-tachometer-alt mr-2 text-green-500"></i>
                                <span>Total Kuota: ${totalQuotaGB} GB</span>
                            </div>
                            <div class="flex items-center">
                                <i class="fas fa-hourglass-half mr-2 text-orange-500"></i>
                                <span>Aktif Hingga: ${quota.date_end}</span>
                            </div>
                        </div>
                    </div>
                `;
            });
        });
        return html || '<p class="text-gray-500">Tidak ada detail kuota tersedia.</p>';
    }

    // Fungsi utama untuk cek kuota
    function cekKuota() {
        const nomor = $("#nomorHp").val().trim();
        if (!nomor) {
            toastr.error("Harap masukkan nomor XL/AXIS Anda!");
            $("#nomorHp").focus();
            return;
        }
        if (!/^(08|628)\d{8,11}$/.test(nomor)) {
            toastr.error("Format nomor tidak valid! Gunakan 08xx atau 628xx (10-13 digit).");
            $("#nomorHp").focus();
            return;
        }

        showLoading();
        $("#hasilKuota").html(`
            <div class="shimmer rounded-xl h-20 w-full mb-3"></div>
            <div class="shimmer rounded-xl h-8 w-1/2 mb-3"></div>
            <div class="shimmer rounded-xl h-4 w-full mb-2"></div>
            <div class="shimmer rounded-xl h-4 w-2/3 mb-2"></div>
            <div class="shimmer rounded-xl h-4 w-3/4 mb-2"></div>
        `).removeClass("hidden");

        $.ajax({
            type: "GET",
            url: "https://apigw.kmsp-store.com/sidompul/v3/cek_kuota",
            data: { msisdn: nomor, isJSON: true },
            headers: {
                "Authorization": "Basic c2lkb21wdWxhcGk6YXBpZ3drbXNw",
                "X-API-Key": "4352ff7d-f4e6-48c6-89dd-21c811621b1c",
                "X-App-Version": "3.0.0"
            },
            success: function(response) {
                hideLoading();
                if (response.status === true) {
                    toastr.success("Berhasil mendapatkan data kuota!");
                    const remainingQuotaGB = calculateRemainingQuota(response.data);
                    const quotaDetailsHtml = renderQuotaDetails(response.data);
                    $("#hasilKuota").html(`
                        <div class="quota-summary rounded-xl p-4 mb-4 text-white">
                            <div class="flex items-center justify-between mb-2">
                                <div class="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 icon-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M21 10v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10"></path>
                                        <path d="M22 6H2v4h20V6z"></path>
                                        <path d="M12 2v14"></path>
                                        <path d="M10 6H4.5a2.5 2.5 0 0 1 0-5C7 1 10 6 10 6z"></path>
                                        <path d="M14 6h5.5a2.5 2.5 0 0 0 0-5C17 1 14 6 14 6z"></path>
                                    </svg>
                                    <h3 class="text-lg font-semibold">Sisa Kuota Anda</h3>
                                </div>
                                <div class="bg-white bg-opacity-20 rounded-lg px-2 py-1 text-sm">${remainingQuotaGB} GB</div>
                            </div>
                        </div>
                        <div class="space-y-4">
                            <h3 class="text-lg font-semibold text-gray-800 flex items-center">
                                <i class="fas fa-list-alt mr-2 text-blue-500"></i>
                                Detail Kuota
                            </h3>
                            ${quotaDetailsHtml}
                        </div>
                    `).removeClass("hidden");
                } else {
                    toastr.error(response.message || "Gagal mendapatkan data kuota.");
                    $("#hasilKuota").html(`
                        <div class="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-5 border border-red-100">
                            <div class="flex items-center mb-3">
                                <div class="bg-red-100 p-2 rounded-full mr-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                        <line x1="12" y1="9" x2="12" y2="13"></line>
                                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                    </svg>
                                </div>
                                <h3 class="text-lg font-semibold text-gray-800">Gagal</h3>
                            </div>
                            <div class="border-t border-gray-200 pt-3 text-red-600">${response.data?.keteranganError || "Tidak ada keterangan error."}</div>
                        </div>
                    `).removeClass("hidden");
                }
            },
            error: function(xhr, status, error) {
                hideLoading();
                toastr.error("Kesalahan jaringan. Silakan coba lagi.");
                $("#hasilKuota").html(`
                    <div class="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-5 border border-red-100">
                        <div class="flex items-center mb-3">
                            <div class="bg-red-100 p-2 rounded-full mr-3">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="1" y1="1" x2="23" y2="23"></line>
                                    <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
                                    <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
                                    <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
                                    <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
                                    <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                                    <line x1="12" y1="20" x2="12.01" y2="20"></line>
                                </svg>
                            </div>
                            <h3 class="text-lg font-semibold text-gray-800">Error</h3>
                        </div>
                        <div class="border-t border-gray-200 pt-3 text-red-600">Gagal terhubung ke server. Periksa koneksi Anda.</div>
                    </div>
                `).removeClass("hidden");
                console.error("AJAX Error:", error);
            }
        });
    }

    // Animasi input saat fokus
    $("#nomorHp").on("focus", function() {
        $(this).parent().parent().addClass("scale-105").css("transition", "all 0.3s ease");
    }).on("blur", function() {
        $(this).parent().parent().removeClass("scale-105");
    });
});
