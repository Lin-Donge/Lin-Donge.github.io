$(function () {
  'use strict';

  // WeChat QR Code Modal
  var qrModal = $('<div>').addClass('wechat-qr-modal').hide()
    .append($('<div>').addClass('wechat-qr-container')
      .append($('<div>').addClass('wechat-qr-close').text('×'))
      .append($('<div>').addClass('wechat-qr-title').text('微信扫码分享'))
      .append($('<div>').addClass('wechat-qr-code')
        .append($('<img>').attr('src', '/assets/img/icons/qrcode.png').attr('alt', '微信二维码'))
      )
    );
  $('body').append(qrModal);

  // Close QR modal when clicking outside or on close button
  qrModal.click(function(e) {
    if ($(e.target).hasClass('wechat-qr-modal') || $(e.target).hasClass('wechat-qr-close')) {
      qrModal.hide();
    }
  });

  // Show WeChat QR code
  window.showWechatQR = function() {
    qrModal.show();
  };


  /* -------- Scroll to top button ------- */
  $(".top").click(function() {
    $("html, body")
      .stop()
      .animate({ scrollTop: 0 }, "slow", "swing");
  });

  $(window).scroll(function() {
    if ($(this).scrollTop() > $(window).height()) {
      $(".top").addClass("is-active");
    } else {
      $(".top").removeClass("is-active");
    }
  });

  // Cache variables for increased performance on devices with slow CPUs.
  var flexContainer = $('div.flex-container')
  var searchBox = $('.search-box')
  var searchClose = $('.search-icon-close')
  var searchInput = $('#search-input')
  var waiting;

  // Menu button
  $('.menu-icon, .menu-icon-close').click(function (e) {
    e.preventDefault()
    e.stopPropagation()
    if (flexContainer.hasClass('active')){
      hideLayer();
    } else {
      flexContainer.addClass('active')
      setTimeout(function () {
        flexContainer.removeClass('transparent').addClass('opaque');
      }, 10);
    }
  })

  // Click to close
  flexContainer.click(function (e) {
    if (flexContainer.hasClass('active') && e.target.tagName !== 'A') {
      if (e.target.classList.contains('night')) {
        clearTimeout(waiting);
        waiting = setTimeout(function() {
          hideLayer();
        }, 1000);
      } else {
        hideLayer();
      }
    }
  })

  function hideLayer () {
    flexContainer.removeClass('opaque')
    flexContainer.addClass('transparent');
    setTimeout(function(){
      flexContainer.removeClass('active');
    }, 600)
  }

  // Press Escape key to close menu
  $(window).keydown(function (e) {
    if (e.key === 'Escape') {
      if (flexContainer.hasClass('active')) {
        hideLayer();
      } else if (searchBox.hasClass('search-active')) {
        searchBox.removeClass('search-active');
      }
    }
  })

  // Search button
  $('.search-icon').click(function (e) {
    e.preventDefault()
    if($('.search-form.inline').length == 0){
        searchBox.toggleClass('search-active')
    }
    searchInput.focus()
    if (searchBox.hasClass('search-active')) {
      searchClose.click(function (e) {
    		e.preventDefault()
    		searchBox.removeClass('search-active')
    	})
    }
  })
});