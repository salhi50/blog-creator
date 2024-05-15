$(function () {
  $("[data-page]").on("click", function () {
    $("input[name='page']").val($(this).attr("data-page"));
    $("form").trigger("submit");
  });
});
