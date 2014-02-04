var ajax_in_action = false;

function add_item_to_cart (item_id, price)
{
    if (ajax_in_action) return false;

    // indicate loading
    ajax_in_action = true;
    $('.shop-item-full-info__actions .ajax-msg').remove();
    $('.ajax-loader__item-to-cart').show();

    // посылаем запрос на добавление
    $.post('/ajax/add_item_to_cart', { item_id: item_id, item_qty: 1, item_price: price }, function(r) {

        ajax_in_action = false;

        $('.ajax-loader__item-to-cart').hide();

        if (r.ok)
        {
            $('.shop-item-full-info__actions').append('<div class="ajax-msg ajax-msg__item-to-cart">'+r.msg+'</div>');
            $('.cart-informer__total').html(r.total_sum);
        }
        else
        {
            alert(r.msg);
        }
    }, "json");
}

function delete_item_from_cart (item_id, row_id)
{
    ajax_in_action = true;

    $.post('/ajax/del_item_from_cart', { item_id: item_id, row_id: row_id }, function(r) {
        if (r.ok)
        {
            // удаляем строчку с товаром
            $('.cart-item__'+row_id).fadeOut('normal', function () {
                $('.cart-item__'+row_id).remove();
            });

            // инфо корзины сверху
            $('.cart-informer__total').html(r.total_sum);

            // если это был последний (единственный) товар в корзине, скрываем ссылку за оформление заказа
            //if (parseInt(r.total_qty)==0) $('.step-1 .next-step').hide();
        }
        ajax_in_action = false;
    }, "json");
}

function try_login ()
{
    if (!$('#login_email').val()) {
        $('.tab-login .login-msg').html('Не введен Email.');
        $('#login_email').focus();
        return false;
    }
    if (!$('#login_pass').val()) {
        $('#login_pass').focus();
        $('.tab-login .login-msg').html('Не введен пароль.');
        return false;
    }
    if (check_email_format($('#login_email').val()) == false) {
        $('.tab-login .login-msg').html('Email введен некорректно.');
        $('#login_email').focus().addClass('err');
        return false;
    }
    else {$('#login_email').removeClass('err');}

    $('.auth-top-block .tab-login .action-line .loading').removeClass('hidden');

    $.post('/ajax/try_login', { login_email: $('#login_email').val(), login_pass: $('#login_pass').val(), login_remember: $('#remember_me').prop('checked') }, function(data) {
        if (data.status)
        {
            window.location.reload();
        }
        else
        {
            $('.login-msg').html(data.msg);
        }
        $('.auth-top-block .tab-login .action-line .loading').addClass('hidden');
    }, "json");
    
    return false;
}


function show_save_qty_changes ()
{
    $('#save_qty_changes').removeClass('hidden');
    $('#next_step_link').addClass('hidden');

    $.each($('.order-cart-items tbody tr'), function(a, b) {
        if ($(b).find('input[name=qty]').val() == 0)
            $(b).find('input[name=qty]').val('1');
        //alert($(b).find('input[name=qty]').val());
    });
}

function save_cart_qty_changes ()
{
    var update_items = '';
    $.each($('.order-cart-items tbody tr'), function(a, b) {
        update_items = update_items+$(b).attr('id').replace('cart-item-', '')+':';
        update_items = update_items+$(b).find('input[name=qty]').val()+';';
    });
    if (update_items.length > 0)
    {
        $.post('/ajax/update_cart_qty', { update_items: update_items }, function(data) {
            if (data.status)
            {
                $('.price-for-all span').html(data.new_total_price);
                $('#save_qty_changes').addClass('hidden');
                $('#next_step_link').removeClass('hidden');
            }
            else
            {
                alert('Извините, произошла ошибка.')
            }
        }, "json");
    }
}


function save_new_delivery_address ()
{
    if ($('#new_d_address').val() == '') { $('#new_d_address').focus(); return false; }

    $.post('/ajax/add_new_delivery_address', { new_address: $('#new_d_address').val() }, function(data) {
        if (data.status == 1)
        {
            $('#current_delivery_addresses').append('<li style="display:none;" id="a-'+data.new_id+'">— '+$('#new_d_address').val()+' <a href="javascript:;" class="del" title="Удалить" onclick="delete_delivery_address('+data.new_id+')">x</a></li>');
            $('#new_d_address').val('');
            $('#current_delivery_addresses li').last().slideDown(300);
        }
        else
        {
            alert('Извините, произошла ошибка.')
        }
    }, "json");
}


function delete_delivery_address (a_id)
{
    $.post('/ajax/delete_delivery_address', { address_id: a_id }, function(data) {
        if (data.status == 1)
        {
            $('#current_delivery_addresses li#a-'+a_id).slideUp(300);
        }
    }, "json");
}


function show_new_delivery_address_field ()
{
    $('input[name=new_delivery_address]').removeClass("hidden").focus();
}


function show_order_info (a)
{
    if ($(a).parent().parent().children('.positions').hasClass('closed'))
    {
        $(a).parent().parent().children('.positions').slideDown(300, function() {
            $(a).parent().parent().children('.positions').removeClass('closed').addClass('opened');
        });
    }
    else if ($(a).parent().parent().children('.positions').hasClass('opened'))
    {
        $(a).parent().parent().children('.positions').slideUp(300, function() {
            $(a).parent().parent().children('.positions').removeClass('opened').addClass('closed');
        });
    }
}


function show_edit_address (a)
{
    $(a).parent().parent().children('.edit').toggleClass('hidden');
    $(a).parent().parent().children('.view').toggleClass('hidden');
}


function update_delivery_address (a, a_id)
{
    if ($(a).parent().children('input').val() == '') $(a).parent().children('input').focus();
    $.post('/ajax/update_delivery_address', { address_id: a_id, new_val: $(a).parent().children('input').val() }, function(data) {
        if (data.status == 1)
        {
            $(a).parent().parent().children('.view').children('span').html($(a).parent().children('input').val());
            show_edit_address(a);
        }
    }, "json");
}


function try_fp ()
{
    if ($('#login_email').val() == '' || check_email_format($('#login_email').val()) == false)
    {
        $('.login-msg').html('Заполните корректно поле E-mail и нажмите снова «Забыл пароль»');
        return false;
    }

    $.post('/ajax/fp_email', { email: $('#login_email').val() }, function(data) {
        if (data.status == 1)
        {
            $('.login-msg').html('Мы выслали Вам письмо с инструкцией по восстановлению пароля.');
        }
        else
        {
            $('.login-msg').html(data.error_msg);
        }
    }, "json");
}


function submit_details ()
{
    $('.firm-details form label').removeClass('err');
    $.each($('input.req'), function (a, b) {
        if ($(b).val() == '')
        {
            $(b).focus();
            $(b).parent().children('label').addClass('err');
            return false;
        }
    });

    $('.firm-details form').submit();
}


function check_required_details()
{
    var errors = false;
    $.each($('input.req'), function (a, b) {
       if ($(b).val() == '')
       {
           errors = true;
       }
    });

    if (!errors)
    {
        $('input[name=btn_submit]').prop('disabled', '');
    }
    else
    {
        $('input[name=btn_submit]').prop('disabled', 'disabled');
    }
}

function new_f ()
{
    
}