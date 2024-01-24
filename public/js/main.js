


function submitNewAddress() {
    clearErrorMessages();

    const fields = ["newFirstName", "newLastName", "newCompanyName", "newCountry", "newStreetAddress", "newCity", "newState", "newPincode", "newMobile", "newEmail"];
    const errors = [];

    for (const field of fields) {
        const value = document.getElementById(field).value.trim();

        if (!isValidInput(value)) {
            errors.push(`Please enter a valid ${field.replace("new", "").toLowerCase()}.`);
        }
    }

    const email = document.getElementById("newEmail").value.trim();
    if (!isValidEmail(email)) {
        errors.push("Please enter a valid email address.");
    }

    if (errors.length > 0) {
        displayError(errors[0]); // Display the first error
        return;
    }

    const formData = $('#newAddressForm').serialize();

    $.ajax({
        url: "/add-address",
        method: "POST",
        data: formData,
        success: function (response) {
            console.log(response);
            location.reload();

        },
        error: function (error) {
            console.error('Error adding new address:', error.message);
        }
    });
}

function isValidInput(value) {
    return value !== "" && !/^\s+$/.test(value);
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function displayError(error) {
    const errorContainer = $('.error-container');
    errorContainer.text(error).show();
}

function clearErrorMessages() {
    $('.error-container').hide().empty();
}

document.addEventListener("DOMContentLoaded", function () {
    // Get all elements with the class 'flipkart-dropdown'
    var dropdowns = document.querySelectorAll('.flipkart-dropdown');

    // Add event listeners to each dropdown
    dropdowns.forEach(function (dropdown) {
        // Get the dropdown button and content
        var btn = dropdown.querySelector('.dropdown-btn');
        var content = dropdown.querySelector('.flipkart-dropdown-content');

        // Add event listeners for mouseenter and mouseleave
        dropdown.addEventListener('mouseenter', function () {
            // Show the dropdown content when mouse enters
            content.style.display = 'block';
        });

        dropdown.addEventListener('mouseleave', function () {
            // Hide the dropdown content when mouse leaves
            content.style.display = 'none';
        });
    });
});


async function update() {
    try {
        const formData = $('#userDetailsForm').serialize();

        const res = await $.ajax({
            url: "/edit-details",
            method: "POST",
            data: formData
        });

        const newData = $(res).find('#userDetailsForm').html();
        $('#userDetailsForm').html(newData);
    } catch (error) {
        console.error('Error updating form:', error.message);
    }
}




function toggleEdit(inputId) {
    var input = document.getElementById(inputId);
    var errorElement = document.getElementById(inputId + 'Error');

    // Clear previous error messages
    errorElement.innerText = '';

    // Disable editing for all other input fields
    var allInputs = document.querySelectorAll('.editable');
    allInputs.forEach(function (otherInput) {
        if (otherInput.id !== inputId) {
            disableInput(otherInput);
        }
    });

    if (input.readOnly) {
        enableInput(input);
        showSubmitButton();
    } else {
        // Validate before disabling input
        var isValid = validateInput(input, errorElement);
        if (isValid) {
            disableInput(input);
            hideSubmitButton();
        }
    }
}

function validateInput(input, errorElement) {
    var value = input.value.trim();

    if (value === '') {
        errorElement.innerText = 'This field is required.';
        return false;
    }

    if (input.type === 'email') {
        // Email format validation
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            errorElement.innerText = 'Invalid email format.';
            return false;
        }
    }

    // Add more validation rules as needed

    // Clear error message if validation passes
    errorElement.innerText = '';
    return true;
}

function enableInput(input) {
    input.readOnly = false;
    input.classList.add('editable');
    input.classList.remove('disabled');
    input.focus();
}

function disableInput(input) {
    input.readOnly = true;
    input.classList.remove('editable');
    input.classList.add('disabled');
}

function showSubmitButton() {
    var submitContainer = document.getElementById('submitContainer');
    submitContainer.style.display = 'block';
}

function hideSubmitButton() {
    var submitContainer = document.getElementById('submitContainer');
    submitContainer.style.display = 'none';
}

// Form submission validation




(function ($) {
    "use strict";

    /*[ Load page ]
    ===========================================================*/
    $(".animsition").animsition({
        inClass: 'fade-in',
        outClass: 'fade-out',
        inDuration: 1500,
        outDuration: 800,
        linkElement: '.animsition-link',
        loading: true,
        loadingParentElement: 'html',
        loadingClass: 'animsition-loading-1',
        loadingInner: '<div class="loader05"></div>',
        timeout: false,
        timeoutCountdown: 5000,
        onLoadEvent: true,
        browser: ['animation-duration', '-webkit-animation-duration'],
        overlay: false,
        overlayClass: 'animsition-overlay-slide',
        overlayParentElement: 'html',
        transition: function (url) { window.location.href = url; }
    });

    /*[ Back to top ]
    ===========================================================*/
    var windowH = $(window).height() / 2;

    $(window).on('scroll', function () {
        if ($(this).scrollTop() > windowH) {
            $("#myBtn").css('display', 'flex');
        } else {
            $("#myBtn").css('display', 'none');
        }
    });

    $('#myBtn').on("click", function () {
        $('html, body').animate({ scrollTop: 0 }, 300);
    });


    /*==================================================================
    [ Fixed Header ]*/
    var headerDesktop = $('.container-menu-desktop');
    var wrapMenu = $('.wrap-menu-desktop');

    if ($('.top-bar').length > 0) {
        var posWrapHeader = $('.top-bar').height();
    }
    else {
        var posWrapHeader = 0;
    }


    if ($(window).scrollTop() > posWrapHeader) {
        $(headerDesktop).addClass('fix-menu-desktop');
        $(wrapMenu).css('top', 0);
    }
    else {
        $(headerDesktop).removeClass('fix-menu-desktop');
        $(wrapMenu).css('top', posWrapHeader - $(this).scrollTop());
    }

    $(window).on('scroll', function () {
        if ($(this).scrollTop() > posWrapHeader) {
            $(headerDesktop).addClass('fix-menu-desktop');
            $(wrapMenu).css('top', 0);
        }
        else {
            $(headerDesktop).removeClass('fix-menu-desktop');
            $(wrapMenu).css('top', posWrapHeader - $(this).scrollTop());
        }
    });


    /*==================================================================
    [ Menu mobile ]*/
    $('.btn-show-menu-mobile').on('click', function () {
        $(this).toggleClass('is-active');
        $('.menu-mobile').slideToggle();
    });

    var arrowMainMenu = $('.arrow-main-menu-m');

    for (var i = 0; i < arrowMainMenu.length; i++) {
        $(arrowMainMenu[i]).on('click', function () {
            $(this).parent().find('.sub-menu-m').slideToggle();
            $(this).toggleClass('turn-arrow-main-menu-m');
        })
    }

    $(window).resize(function () {
        if ($(window).width() >= 992) {
            if ($('.menu-mobile').css('display') == 'block') {
                $('.menu-mobile').css('display', 'none');
                $('.btn-show-menu-mobile').toggleClass('is-active');
            }

            $('.sub-menu-m').each(function () {
                if ($(this).css('display') == 'block') {
                    console.log('hello');
                    $(this).css('display', 'none');
                    $(arrowMainMenu).removeClass('turn-arrow-main-menu-m');
                }
            });

        }
    });


    /*==================================================================
    [ Show / hide modal search ]*/
    $('.js-show-modal-search').on('click', function () {
        $('.modal-search-header').addClass('show-modal-search');
        $(this).css('opacity', '0');
    });

    $('.js-hide-modal-search').on('click', function () {
        $('.modal-search-header').removeClass('show-modal-search');
        $('.js-show-modal-search').css('opacity', '1');
    });

    $('.container-search-header').on('click', function (e) {
        e.stopPropagation();
    });


    /*==================================================================
    [ Isotope ]*/
    var $topeContainer = $('.isotope-grid');
    var $filter = $('.filter-tope-group');

    // filter items on button click
    $filter.each(function () {
        $filter.on('click', 'button', function () {
            var filterValue = $(this).attr('data-filter');
            $topeContainer.isotope({ filter: filterValue });
        });

    });

    // init Isotope
    $(window).on('load', function () {
        var $grid = $topeContainer.each(function () {
            $(this).isotope({
                itemSelector: '.isotope-item',
                layoutMode: 'fitRows',
                percentPosition: true,
                animationEngine: 'best-available',
                masonry: {
                    columnWidth: '.isotope-item'
                }
            });
        });
    });

    var isotopeButton = $('.filter-tope-group button');

    $(isotopeButton).each(function () {
        $(this).on('click', function () {
            for (var i = 0; i < isotopeButton.length; i++) {
                $(isotopeButton[i]).removeClass('how-active1');
            }

            $(this).addClass('how-active1');
        });
    });

    /*==================================================================
    [ Filter / Search product ]*/
    $('.js-show-filter').on('click', function () {
        $(this).toggleClass('show-filter');
        $('.panel-filter').slideToggle(400);

        if ($('.js-show-search').hasClass('show-search')) {
            $('.js-show-search').removeClass('show-search');
            $('.panel-search').slideUp(400);
        }
    });

    $('.js-show-search').on('click', function () {
        $(this).toggleClass('show-search');
        $('.panel-search').slideToggle(400);

        if ($('.js-show-filter').hasClass('show-filter')) {
            $('.js-show-filter').removeClass('show-filter');
            $('.panel-filter').slideUp(400);
        }
    });





    /*==================================================================
    [ +/- num product ]*/
    $('.btn-num-product-down').on('click', function () {
        var numProduct = Number($(this).next().val());
        if (numProduct > 1) $(this).next().val(numProduct - 1);
    });

    $('.btn-num-product-up').on('click', function () {
        var numProduct = Number($(this).prev().val());
        $(this).prev().val(numProduct + 1);
    });

    /*==================================================================
    [ Rating ]*/
    $('.wrap-rating').each(function () {
        var item = $(this).find('.item-rating');
        var rated = -1;
        var input = $(this).find('input');
        $(input).val(0);

        $(item).on('mouseenter', function () {
            var index = item.index(this);
            var i = 0;
            for (i = 0; i <= index; i++) {
                $(item[i]).removeClass('zmdi-star-outline');
                $(item[i]).addClass('zmdi-star');
            }

            for (var j = i; j < item.length; j++) {
                $(item[j]).addClass('zmdi-star-outline');
                $(item[j]).removeClass('zmdi-star');
            }
        });

        $(item).on('click', function () {
            var index = item.index(this);
            rated = index;
            $(input).val(index + 1);
        });

        $(this).on('mouseleave', function () {
            var i = 0;
            for (i = 0; i <= rated; i++) {
                $(item[i]).removeClass('zmdi-star-outline');
                $(item[i]).addClass('zmdi-star');
            }

            for (var j = i; j < item.length; j++) {
                $(item[j]).addClass('zmdi-star-outline');
                $(item[j]).removeClass('zmdi-star');
            }
        });
    });

    /*==================================================================
    [ Show modal1 ]*/
    $('.js-show-modal1').on('click', function (e) {
        e.preventDefault();
        $('.js-modal1').addClass('show-modal1');
    });

    $('.js-hide-modal1').on('click', function () {
        $('.js-modal1').removeClass('show-modal1');
    });



})(jQuery);