
async function searchUser(event) {
	const name = event.target.value.trim()
	if (name !== '') {
		$.ajax({
			url: '/admin/users',
			method: "GET",
			data: {
				name: name
			},
			success: (res) => {
				window.location.href = `/admin/users?name=${name}`
			},
			error: (err) => {
				console.log(err.message);
			}
		})
	}
}


async function searchCategory(event) {
	const name = event.target.value.trim()
	if (name !== '') {
		$.ajax({
			url: '/admin/catogories',
			method: "GET",
			data: {
				name: name
			},
			success: (res) => {
				window.location.href = `/admin/catogories?name=${name}`
			},
			error: (err) => {
				console.log(err.message);
			}
		})
	}
}



async function searchProducts(event) {
	try {
		const name = event.target.value.trim()
		if (name!=='') {
			$.ajax({
			url:'/admin/products',
			method:"GET",
			data:{
				name:name
			},
			success:(res)=>{
				window.location.href = `/admin/products?name=${name}`
			},
			error:(err)=>{
				throw new Error(err)
			}
		})
		}
		
	} catch (error) {
		console.log('error in searching products:', error.message);
	}
}



async function productsSort2(event, page, sort, name) {
	const sort2 = event.target.value
	if (sort) {
		$.ajax({
			url: '/admin/products',
			method: "GET",
			data: {
				sort: sort,
				page: page,
				sort2: sort2,
				name: name
			},
			success: (res) => {
				$('#content-main').html($(res).find('#content-main').html())
			},
			error: (error) => {
				console.log(error.message)
			}
		})
	}
}

async function productsSort(event, page, sort2, name) {
	const sort = event.target.value
	if (sort) {
		$.ajax({
			url: '/admin/products',
			method: "GET",
			data: {
				sort: sort,
				page: page,
				sort2: sort2,
				name: name
			},
			success: (res) => {
				$('#content-main').html($(res).find('#content-main').html())
			},
			error: (error) => {
				console.log(error.message)
			}
		})
	}
}


async function block(id) {
	try {
		const response = await $.ajax({
			url: "/admin/userblock/" + id,
			method: "GET"
		});

		const newContent = $(response).find(".user" + id).html();
		$(".user" + id).html(newContent);

	} catch (error) {
		console.error("Error blocking user:", error);
	}
}

async function unblock(id) {
	try {
		const response = await $.ajax({
			url: "/admin/userUnblock/" + id,
			method: "GET"
		});

		const newContent = $(response).find(".user" + id).html();
		$(".user" + id).html(newContent);

	} catch (error) {
		console.error("Error unblocking user:", error);
	}
}



async function orderSort2(event, page, sort) {
	try {
		const sort2 = event.target.value;
		$.ajax({
			url: '/admin/orders-list',
			method: 'GET',
			data: {
				page: page,
				sort: sort,
				sort2: sort2
			},
			success: (res) => {
				window.location.href = `/admin/orders-list?page=${page}&&sort=${sort}&&sort2=${sort2}`
				// $('#content-main').html($(res).find('#content-main').html())
			},
			error: (error) => {
				throw new Error("error", error.message)
			}
		})
	} catch (error) {
		console.log(error.message);
	}
}


async function orderSort(page, event, sort2) {
	try {
		const sort = event.target.value;
		if (sort) {
			$.ajax({
				url: '/admin/orders-list',
				method: 'GET',
				data: {
					page: page,
					sort: sort,
					sort2: sort2
				},
				success: (res) => {
					window.location.href = `/admin/orders-list?page=${page}&&sort=${sort}&&sort2=${sort2}`
					// $('#content-main').html($(res).find('#content-main').html())
				},
				error: (error) => {
					throw new Error("error", error.message)
				}
			});
		}
	} catch (error) {
		console.log(error.message);
	}
}


async function userSort(event, page,name) {
	try {
		const sort = event.target.value
		if (sort) {
			const res = await $.ajax({
				url: "/admin/users",
				method: 'GET',
				data: {
					sort: sort,
					page: page,
					name:name
				}
			})
			$('#content-main').html($(res).find('#content-main').html());
		}
	} catch (error) {
		console.log(error.message);
	}
}


async function categorySort(event, page,name) {
	const sort = event.target.value;
	if (sort) {
		try {
			const res = await $.ajax({
				url: '/admin/catogories',
				method: "GET",
				data: {
					page: page,
					sort: sort,
					name:name
				}
			});
			$('#content-main').html($(res).find('#content-main').html());
		} catch (error) {
			console.error('An error occurred:', error);
			// Handle error appropriately, e.g., show a message to the user
		}
	}
}


const dialog = document.querySelector("dialog");
const closeBtn = document.querySelector('#close');
const openBtn = document.querySelector("#Open");

openBtn.addEventListener('click', () => {
	dialog.classList.add('open');
	dialog.showModal();
})

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
	$('.menu-item.has-submenu .menu-link').on('click', function (e) {
		e.preventDefault();
		if ($(this).next('.submenu').is(':hidden')) {
			$(this).parent('.has-submenu').siblings().find('.submenu').slideUp(200);
		}
		$(this).next('.submenu').slideToggle(200);
	});

	// mobile offnavas triggerer for generic use
	$("[data-trigger]").on("click", function (e) {
		e.preventDefault();
		e.stopPropagation();
		var offcanvas_id = $(this).attr('data-trigger');
		$(offcanvas_id).toggleClass("show");
		$('body').toggleClass("offcanvas-active");
		$(".screen-overlay").toggleClass("show");

	});

	$(".screen-overlay, .btn-close").click(function (e) {
		$(".screen-overlay").removeClass("show");
		$(".mobile-offcanvas, .show").removeClass("show");
		$("body").removeClass("offcanvas-active");
	});

	// minimize sideber on desktop

	$('.btn-aside-minimize').on('click', function () {
		if (window.innerWidth < 768) {
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