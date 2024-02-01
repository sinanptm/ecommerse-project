
async function changeStatus(id) {
	try {
		const formdata = $('#statuschange').serialize();
		const res = await $.ajax({
			url: "/admin/edit-order/" + id,
			method: 'POST',
			data: formdata
		});
		const newContent = $(res).find(".steps").html();
		$('.steps').html(newContent);

	} catch (error) {
		console.log(error.message);
	}
}

async function ordersPagePagination(pageNumber) {
	try {
		const response = await $.ajax({
			url: "/admin/orders-list?page=" + pageNumber,
			method: "GET"
		});
		// console.log(response);
		const newProductOverview = $(response).find('#content-mains').html();
		const newPagination = $(response).find('.pagination-area').html();
		$('#content-main').html(newProductOverview);
		$('.pagination-area').html(newPagination);
	} catch (error) {
		console.error('Error occurred while fetching pagination data:', error);
	}
}


async function usersPagePagination(pageNumber) {
	try {
		const response = await $.ajax({
			url: "/admin/users?page=" + pageNumber,
			method: "GET"
		});
		const newProductOverview = $(response).find('#content-main').html();
		const newPagination = $(response).find('.pagination-area').html();
		$('#content-main').html(newProductOverview);
		$('.pagination-area').html(newPagination);
	} catch (error) {
		console.error('Error occurred while fetching pagination data:', error);
	}
}

async function productsPagePagination(pageNumber) {
	try {
		const response = await $.ajax({
			url: "/admin/products?page=" + pageNumber,
			method: "GET"
		});
		const newProductOverview = $(response).find('#content-main').html();
		const newPagination = $(response).find('.pagination-area').html();
		$('#content-main').html(newProductOverview);
		$('.pagination-area').html(newPagination);
	} catch (error) {
		console.error('Error occurred while fetching pagination data:', error);
	}
}

async function catogoriesPagePagination(pageNumber) {
	try {
		const response = await $.ajax({
			url: "/admin/catogories?page=" + pageNumber,
			method: "GET"
		});
		const newProductOverview = $(response).find('#content-main').html();
		const newPagination = $(response).find('.pagination-area').html();
		$('#content-main').html(newProductOverview);
		$('.pagination-area').html(newPagination);
	} catch (error) {
		console.error('Error occurred while fetching pagination data:', error);
	}
}


async function list(id) {
	try {
	  const response = await $.ajax({
		url: '/admin/list?id=' + id,
		method: "GET"
	  });
	  const newContent = $(response).find(".id" + id).html();
	  $(".id" + id).html(newContent);
	} catch (error) {
	  console.log(error.message);
	}
  }

  async function unlist(id) {
	try {
	  const response = await $.ajax({
		url: '/admin/unlist?id=' + id,
		method: "GET"
	  });
	  const newContent = $(response).find(".id" + id).html();
	  $(".id" + id).html(newContent);
	} catch (error) {
	  console.log(error.message);
	}
  }




  
(function ($) {
    "use strict";
	//===== jquery code for sidebar menu
	$('.menu-item.has-submenu .menu-link').on('click', function(e){
		e.preventDefault();
		if($(this).next('.submenu').is(':hidden')){
			$(this).parent('.has-submenu').siblings().find('.submenu').slideUp(200);
		} 
		$(this).next('.submenu').slideToggle(200);
	});

	// mobile offnavas triggerer for generic use
	$("[data-trigger]").on("click", function(e){
		e.preventDefault();
		e.stopPropagation();
		var offcanvas_id =  $(this).attr('data-trigger');
		$(offcanvas_id).toggleClass("show");
		$('body').toggleClass("offcanvas-active");
		$(".screen-overlay").toggleClass("show");

	}); 

	$(".screen-overlay, .btn-close").click(function(e){
		$(".screen-overlay").removeClass("show");
		$(".mobile-offcanvas, .show").removeClass("show");
		$("body").removeClass("offcanvas-active");
	}); 

	// minimize sideber on desktop

	$('.btn-aside-minimize').on('click', function(){
		if( window.innerWidth < 768) {
			$('body').removeClass('aside-mini');
			$(".screen-overlay").removeClass("show");
			$(".navbar-aside").removeClass("show");
			$("body").removeClass("offcanvas-active");
		} 
		else {
			// minimize sideber on desktop
			$('body').toggleClass('aside-mini');
		}
	});

	//Nice select
	if ($('.select-nice').length) {
    	$('.select-nice').select2();
	}
	// Perfect Scrollbar
	if ($('#offcanvas_aside').length) {
		const demo = document.querySelector('#offcanvas_aside');
		const ps = new PerfectScrollbar(demo);
	}

	// Dark mode toogle
	$('.darkmode').on('click', function () {
		$('body').toggleClass("dark");
	});
	
})(jQuery);