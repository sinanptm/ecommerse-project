

async function accountPagination(i, filter) {
    try {
        const res = await $.ajax({
            url: `/account?page=${i}&&filter=${filter}`,
            method: "GET"
        })
        console.log(23);
        $('#orders').html($(res).find("#orders").html())
    } catch (error) {
        console.log('error in pagination '+error.message);
    }
}

async function downloadInvoice() {
    try {
        $.ajax({
            url:'/create-invoice',
            method:"POST",
            success:()=>{
                swal("Processing", "Please wait while we are loading", "info");
                document.getElementById('invoiceForm').submit();
            },
            error: (error) => {
                console.error('Error downloading invoice:', error);
                swal("Error", "Failed to download invoice", "error");
            }
        });
    } catch (error) {
        console.error('Error downloading invoice:', error);
        swal("Error", "Failed to download invoice", "error");
    }
}

async function orderFilter(event) {
    try {
        const filter = event.target.value;
        const res = await $.ajax({
            url:'/account',
            method:"GET",
            data:{
                filter:filter
            }
        })
        const newOrder = $(res).find('#orders').html()
        $('#orders').html(newOrder)
    } catch (error) {
        console.log(error);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const copyButtons = document.querySelectorAll('.coupon-btn');

    copyButtons.forEach(button => {
        button.addEventListener('click', function () {
            const codeElement = this.parentElement.querySelector('.code');
            const codeToCopy = codeElement.innerText;

            // Copy the code to clipboard
            navigator.clipboard.writeText(codeToCopy)
                .then(() => {
                    swal("Success!", "Coupon code copied: " + codeToCopy, "success");
                })
                .catch(() => {
                    swal("Error!", "Failed to copy coupon code.", "error");
                });
        });
    });
});

function resetButtonColors() {
    // Reset all button colors to default
    document.getElementById('personal-details-nav').style.color = '';
    document.getElementById('address-nav').style.color = '';
    document.getElementById('orders-nav').style.color = '';
    document.getElementById('wallet-nav').style.color = '';
    document.getElementById('coupon-nav').style.color = '';
}

function showPersonalInfo() {
    resetButtonColors(); // Reset button colors
    document.getElementById('heading').innerHTML = "Personal Details";
    document.getElementById('personal-details-nav').style.color = 'black'
    document.getElementById('personalInfo').style.display = 'block';
    document.getElementById('addresssssss').style.display = 'none';
    document.getElementById('orders').style.display = 'none';
    document.getElementById('walletSection').style.display = 'none';
    document.getElementById('couponsection').style.display = 'none'; // Hide the coupons section
}

function showAddresses() {
    resetButtonColors(); // Reset button colors
    document.getElementById('address-nav').style.color = 'black'
    document.getElementById('heading').innerHTML = "My Addresses";
    document.getElementById('personalInfo').style.display = 'none';
    document.getElementById('addresssssss').style.display = 'block';
    document.getElementById('orders').style.display = 'none';
    document.getElementById('walletSection').style.display = 'none';
    document.getElementById('couponsection').style.display = 'none'; // Hide the coupons section
}

function showOrders() {
    resetButtonColors(); // Reset button colors
    document.getElementById('orders-nav').style.color = 'black'
    document.getElementById('heading').innerHTML = "My Orders";
    document.getElementById('personalInfo').style.display = 'none';
    document.getElementById('addresssssss').style.display = 'none';
    document.getElementById('orders').style.display = 'block';
    document.getElementById('walletSection').style.display = 'none';
    document.getElementById('couponsection').style.display = 'none'; // Hide the coupons section
}

function showWallet() {
    resetButtonColors(); // Reset button colors
    document.getElementById('wallet-nav').style.color = 'black'
    document.getElementById('heading').innerHTML = "Wallet";
    document.getElementById('personalInfo').style.display = 'none';
    document.getElementById('addresssssss').style.display = 'none';
    document.getElementById('orders').style.display = 'none';
    document.getElementById('walletSection').style.display = 'block';
    document.getElementById('couponsection').style.display = 'none'; // Hide the coupons section
}

function showCoupon() {
    resetButtonColors(); // Reset button colors
    document.getElementById('coupon-nav').style.color = 'black'
    document.getElementById('heading').innerHTML = "Coupons";
    document.getElementById('personalInfo').style.display = 'none';
    document.getElementById('addresssssss').style.display = 'none';
    document.getElementById('orders').style.display = 'none';
    document.getElementById('walletSection').style.display = 'none';
    document.getElementById('couponsection').style.display = 'block'; // Display the coupons section
}

async function searchProducts(event) {
    try {
        const name = event.target.value.trim();
        if (name !== "") { 
            const response = await $.ajax({
                url: "/products",
                method: "GET",
                data: {
                    name: name,
                },
                success:(res)=>{
                    window.location.href = `/products?name=${name}`
                },
                error:(err)=>{
                    throw new Error(err);
                }
            });
        }
    } catch (error) {
        console.log('Error when searching:', error.message);
    }
}


let currentOrderId;

function showCancelModal(orderId) {
    currentOrderId = orderId;
    $('#cancelModal').modal('show');
}

function submitCancelOrder() {
    const orderId = currentOrderId;
    let cancelReason = document.getElementById("cancelReason").value;
    cancelReason = cancelReason.trim()

    if (!orderId || !cancelReason) {
        console.error("Order ID and cancel reason are required.");
        return;
    }

    cancelOrder(orderId, cancelReason);
}

async function cancelOrder(orderId, cancelReason) {
    try {
        const response = await fetch('/cancel-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ orderId, cancelReason })
        });

        if (!response.ok) {
            throw new Error('Failed to cancel order');
        }

        window.location.reload();
    } catch (error) {
        console.error(error.message);
    }
}



async function updateQuantity(id, change) {
    try {
        const quantityElement = document.getElementById(`quantity${id}`);
        let quantity = parseInt(quantityElement.value) + change;
        quantity = Math.max(quantity, 1);

        const res = await $.ajax({
            url: "/quantity-manage/" + id,
            method: "POST",
            data: { quantity: quantity },
        });

        const newContent = $(res).find(`#${id}`).html();
        const price = $(res).find(`#prPrice${id}`).html();
        const totals = $(res).find(`#totals`).html();

        $(`#${id}`).html(newContent);
        $(`#prPrice${id}`).html(price);
        $(`#totals`).html(totals);
    } catch (error) {
        console.error("Error updating quantity:", error.message);
    }
}



async function cataogorieSort(event, sort, page, price,name) {
    try {
        const catType = event.target.dataset.sort;
        if (catType) {
            window.location.href = `/products?sort=${sort}&&category=${catType}&&page=${page}&&price=${price}&&name=${name}`
        }
    } catch (error) {
        console.log("error While Caotogrie sort " + error.message);
    }
}

                    
async function productsSort(event, category, page, price ,name) {
    try {
        const sortType = event.target.dataset.sort;
        if (sortType) {
            const res = await $.ajax({
                url: `/products`,
                method: "GET",
                data: {
                    sort: sortType,
                    category: category,
                    page: page,
                    price: price,
                    name:name
                },

            });
            const newProducts = $(res).find("#mainBody").html()
            const pagination = $(res).find('#pagination').html()
            const filter_col1 = $(res).find(".filter-col1").html()
            $("#pagination").html(pagination)
            $('.filter-col1').html(filter_col1)
            $('#mainBody').html(newProducts)
        }
    } catch (error) {
        console.log('error while product sort ' + error.message);
    }
}

async function priceSort(event, page, sort, category,name) {
    try {
        const price = event.target.dataset.sort
        if (price) {
            $.ajax({
                url: "products",
                method: "GET",
                data: {
                    page: page,
                    sort: sort,
                    category: category,
                    price: price,
                    name:name
                },
                success: (res) => {
                    // window.location.href = `/products?page=${page}&&category=${category}&&price=${price}&&sort=${sort}`
                    const newProducts = $(res).find("#mainBody").html()
                    const pagination = $(res).find('#pagination').html()
                    const filter_col1 = $(res).find(".filter-col2").html()
                    $("#pagination").html(pagination)
                    $('.filter-col2').html(filter_col1)
                    $('#mainBody').html(newProducts)
                },
                error: (err) => {
                    throw new Error(err.message)
                }
            }
            )
        }
    } catch (error) {
        console.log('error in price sort :', error.message);
    }

}


function removeProductCart(id) {
    fetch(`/removeProduct/${id}`, {
        method: "DELETE",
        headers: {
            'Content-Type': 'application/json',
        }
    })
        .then(response => {
            if (response.ok) {
                window.location.reload();
            } else {
                throw new Error('Failed to delete product');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to delete product');
        });
}




$("#placeOrder").submit((e) => {
    e.preventDefault();
    $.ajax({
        url: "/place-order",
        method: "POST",
        data: $('#placeOrder').serialize(),
        success: function (res) {

            if (res.status == 200) {
                window.location.href = '/order-success?id=' + res.id
            }
            else if (res.success) {
                var options = {
                    "key": "" + res.key_id + "",
                    "amount": res.amount,
                    "currency": "INR",
                    "name": "Trends Payment",
                    "description": "Payment for online Purchase",
                    "image": "https://wallpapercave.com/wp/wp5390765.jpg",
                    "order_id": "" + res.order_id + "",
                    "handler": function (response) {
                        $.ajax({
                            url: '/online-payment',
                            method: "POST",
                            data: {
                                order: res,
                                payment: response,
                            },
                            success: (ress) => {
                                if (ress.fail) {
                                    alert("payment failed")
                                } else {
                                    window.location.href = '/order-success?id=' + ress.orderid
                                }

                            }
                        })
                    },
                    "prefill": {
                        "contact": "" + res.contact + "",
                        "name": "" + res.name + "",
                        "email": "" + res.email + ""
                    },
                    "notes": {
                        "description": "" + res.description + ""
                    },
                    "theme": {
                        "color": "#169dd2"
                    }
                };
                var razorpayObject = new Razorpay(options);
                razorpayObject.on('payment.failed', function (response) {
                    $("#paymentFailedMessage").show();
                });
                razorpayObject.open();
            }
            else {
                alert(res.msg);
            }
        }
    })
})

function hidePaymentFailedMessage() {
    $("#paymentFailedMessage").hide();
}


async function add_to_cart_whishPage(id) {
    try {
        const response = await $.ajax({
            url: '/add-to-cart',
            method: 'POST',
            data: { quantity: 1, productid: id, wish: 'ss' },
        });
        if (response.stock == false) {
            alert("product is outof stock")
        }
        const noti = $(response).find(".jfdsfd").html();
        const whishpro = $(response).find(".wishlist-list").html()
        $('.jfdsfd').html(noti)
        $(".wishlist-item").html(whishpro)
        if (response.stock == false) {
            alert("product out of stock")
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        $('.notification').text('An error occurred while adding to cart. Please try again later.');
    }
}

async function remoWhishProduct(id) {
    try {
        const res = await $.ajax({
            url: '/remove-from-whishlist?id=' + id + "&&ss=ss",
            method: "GET"
        })
        const newNoti = $(res).find(".whishshs").html()
        const list = $(res).find(".wishlist-list").html()
        $(".whishshs").html(newNoti)
        $(".wishlist-list").html(list)
    } catch (error) {
        console.log(error.message);
    }
}


async function products_whishlist(e, id, name) {
    try {
        const clickedButton = event.target;
        const parentDiv = clickedButton.parentElement;
        const imgElement = parentDiv.querySelector("img");

        if (imgElement.id === "add") {
            const res = await $.ajax({
                url: "/add-to-whishlist?id=" + id,
                method: "GET",
            })
            const newicon = $(res).find('#whish' + id).html();
            const newNoti = $(res).find("#whishshs").html()
            $('#whish' + id).html(newicon);
            $("#whishshs").html(newNoti)

            swal(name, " is added to wishlist !", "success");

        } else if (imgElement.id === "remove") {
            const res = await $.ajax({
                url: "/remove-from-whishlist?id=" + id,
                method: "GET",
            })
            const newicon = $(res).find('#whish' + id).html();
            const newNoti = $(res).find("#whishshs").html()
            $('#whish' + id).html(newicon);
            $("#whishshs").html(newNoti)

        }

    } catch (error) {

    }
}

async function resetmail(email) {
    $('body').css('cursor', 'wait');
    const dialog = document.querySelector("dialog");
    await $.ajax({
        url: "/sendreset",
        method: 'POST',
        data: { email: email },
        success: (res) => {
            $('body').css('cursor', '');

            dialog.classList.remove('open');
            dialog.close();

            $('#emailSendingMessage').text('To change your password verification mail has been sent to your email!');
            $('#emailSendingModal').modal('show');
        },
        error: (xhr, status, error) => {
            $('body').css('cursor', 'auto');
        }
    });
}

var dialog = document.querySelector("dialog");


$(document).ready(function () {
    $('#submitt').on("click", async () => {
        // Retrieve form data
        let formdata = $('#change-password').serialize();

        let password = $('#newpass').val();
        let confirmPassword = $('#confirmpass').val();

        if (password !== confirmPassword) {
            $('#confirmPassError').text("Password and Confirm Password do not match.");
            return; // Prevent form submission
        } else {
            $('#confirmPassError').text("");
        }

        if (password.length < 4) {
            $('#confirmPassError').text("Password must be at least four characters long.");
            return; // Prevent form submission
        } else {
            $('#confirmPassError').text("");
        }

        if (password.includes(" ")) {
            $('#confirmPassError').text("Password cannot contain spaces.");
            return; // Prevent form submission
        } else {
            $('#confirmPassError').text("");
        }

        try {

            const res = await $.ajax({
                url: "/change-password",
                method: "POST",
                data: formdata,
            });
            const newform = $(res).find('#change-password').html();
            let newbu = $(res).find('#sssss').html()
            dialog.classList.add('open');
            dialog.showModal();

            $('#change-password').html(newform);
            $('#sssss').html(newbu);

        } catch (error) {
            console.error(error);
        }
    });
    const closeBtn = document.querySelector('#close');

    const openBtn = document.querySelector("#open");


    openBtn.addEventListener("click", () => {
        dialog.classList.add('open');
        dialog.showModal();
    });

    closeBtn.addEventListener("click", () => {
        dialog.classList.remove('open');
        dialog.close();
    });

    dialog.addEventListener('click', (event) => {
        if (event.target === dialog) {
            dialog.classList.remove('open');
            dialog.close();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && dialog.classList.contains('open')) {
            dialog.classList.remove('open');
            dialog.close();
        }
    });
});



async function addToCartProductPage(id) {
    try {
        const res = await $.ajax({
            url: `/addtocart?id=${id}`,
            method: "GET"
        });

        const newNoti = $(res).find("#jhdwkjadwkj").html();
        const cart = $(res).find('#cccc').html();

        $("#cccc").html(cart);
        $("#jhdwkjadwkj").html(newNoti);

        // Show success message
        swal("Success!", "Product added to cart.", "success");
    } catch (error) {
        console.error("Error:", error);
    }
}



async function addToCartHome(id) {
    try {
        const res = await $.ajax({
            url: `/addtocart?id=${id}&&ss=ss`,
            method: "GET"
        });

        const newNoti = $(res).find("#jhdwkjaladadwkj").html();
        const cart = $(res).find('#cccc').html();

        $("#cccc").html(cart);
        $("#jhdwkjaladadwkj").html(newNoti);
        if (res) {
            swal("Success!", "Product added to cart.", "success");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

function deleteAddress(addressId) {
    if (confirm('Are you sure you want to delete this address?')) {
        fetch(`/delete-address/${addressId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        })
            .then(response => {
                if (response.ok) {
                    window.location.reload();
                } else {
                    throw new Error('Failed to delete address');
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }
}

function submitEditAddress(event,addressId) {
    clearEditAddressErrors();

    const fields = [
        `editFirstName${addressId}`,
        `editLastName${addressId}`,
        `editCompanyName${addressId}`,
        `editCountry${addressId}`,
        `editStreetAddress${addressId}`,
        `editCity${addressId}`,
        `editState${addressId}`,
        `editPincode${addressId}`,
        `editMobile${addressId}`,
        `editEmail${addressId}`
    ];

    const errors = [];

    for (const field of fields) {
        const value = document.getElementById(field).value.trim();

        if (!isValidInput(value)) {
            errors.push(`Please enter a valid ${field.replace(addressId, "").toLowerCase()}.`);
        }
    }

    const email = document.getElementById(`editEmail${addressId}`).value.trim();
    if (!isValidEmail(email)) {
        errors.push("Please enter a valid email address.");
    }

    if (errors.length > 0) {
        displayEditAddressErrors(errors[0]);
        return;
    }
    event.preventDefault();

    const formData = $(`#editAddressForm${addressId}`).serialize();

    $.ajax({
        url: `/edit-address/${addressId}`,
        method: "PUT",
        data: formData,
        success: function (response) {
            const newData = $(response).find(`.address${addressId}`).html();
            $(`.address${addressId}`).html(newData);
            $(`#editAddressModal${addressId}`).modal('hide');
        },
        error: function (error) {
            swal("Success!", "Address updated successfully", "success");
            console.error('Error editing address:', error.message);
        }
    });
}

function displayEditAddressErrors(error) {
    const errorContainer = $('.edit-error-container');
    errorContainer.text(error).show();
}

function clearEditAddressErrors() {
    $('.edit-error-container').hide().empty();
}



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
        const formData = $('#userDetailsForm').serialize(); // Serialize the form data
        const res = await $.ajax({
            url: "/edit-details",
            method: "PUT",
            data: formData
        });

        $('#userDetailsForm').html(res);

    } catch (error) {
        console.error('Error updating form:', error.message);
        swal("Success!", "Details updated successfully", "success");
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

    $(document).ready(function () {
        $('.js-show-modal-search').on('click', function () {
            $('.search-input-container').toggle();
        });
    });

    // /*==================================================================
    // [ Show / hide modal search ]*/
    // $('.js-show-modal-search').on('click', function () {
    //     $('.modal-search-header').addClass('show-modal-search');
    //     $(this).css('opacity', '0');
    // });

    // $('.js-hide-modal-search').on('click', function () {
    //     $('.modal-search-header').removeClass('show-modal-search');
    //     $('.js-show-modal-search').css('opacity', '1');
    // });

    // $('.container-search-header').on('click', function (e) {
    //     e.stopPropagation();
    // });


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