<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="EditCalendar.aspx" Inherits="System.Web.Mvc.ViewPage<AzureCalendarMvcWeb.Models.Calendar>" %>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

<html xmlns="http://www.w3.org/1999/xhtml" >
<head>
    <meta http-equiv="X-UA-Compatible" content="IE=7" />
    <title>修改日程详细</title>
    <link href="<%=Url.Content("~/Theme/Default/main.css") %>" rel="stylesheet" type="text/css" />  
    <link href="<%=Url.Content("~/Theme/Default/dp.css") %>" rel="stylesheet" />
    <link href="<%=Url.Content("~/Theme/Default/dropdown.css") %>" rel="stylesheet" />
    <link href="<%=Url.Content("~/Theme/Default/colorselect.css") %>" rel="stylesheet" />
     <style type="text/css">
     .calpick
     {
        width:25px;
        border:none;
        cursor:pointer;
        background:url("/images/icons/cal.gif") no-repeat center 2px;
        margin-left:-22px;
     }
     </style>
</head>
<body>
    <div>
      <div class="toolBotton">
           <a id="Savebtn" class="imgbtn" href="javascript:void(0);">
                <span class="Save"  title="保存修改">保存(<u>S</u>)</span>
           </a>
           <% if (Model.Id > 0)
              {%>
               <a id="Deletebtn" class="imgbtn" href="javascript:void(0);">
                    <span class="Delete" title="取消该日程">删除(<u>D</u>)</span>
                </a>
            <%} %>
            <a id="Closebtn" class="imgbtn" href="javascript:void(0);">
                <span class="Close" title="关闭" >关闭</span></a>
            </a>
        </div>        
         <div style="clear: both">
         </div>
        <div class="infocontainer">
            <% using (Html.BeginForm("SaveCalendar", "CM", new { id = Model.Id }, FormMethod.Post, new { id = "fmEdit", @class = "fform" }))
               {
            %>
                <label>
                    <span>
                        *主题：
                    </span>
                    <div id="calendarcolor"></div><% =Html.TextBox("Subject", Model.Subject, new { style = "width:85%;",@class="required safe", MaxLength = "200" })%>
                    <%=Html.Hidden("colorvalue",Model.Category)%>
                </label>
                 <label>
                    <span>
                       *时间：
                    </span>
                    <div>
                      <% =Html.TextBox("stpartdate", Model.StartTime > DateTime.MinValue ? Model.StartTime.ToString("yyyy-MM-dd") : "", new {@class="required date", style = "padding-left:2px;width:90px;", MaxLength = "10" })%>
                      <% =Html.TextBox("stparttime", Model.StartTime > DateTime.MinValue ? Model.StartTime.ToString("HH:mm") : "", new { @class="required time", style = "width:40px;", MaxLength = "5" })%>
到
                      <% =Html.TextBox("etpartdate", Model.EndTime > DateTime.MinValue ? Model.EndTime.ToString("yyyy-MM-dd") : "", new { @class = "required date", style = "padding-left:2px;width:90px;", MaxLength = "10" })%>
                      <% =Html.TextBox("etparttime", Model.EndTime > DateTime.MinValue ? Model.EndTime.ToString("HH:mm") : "", new { @class="required time", style = "width:40px;", MaxLength = "50" })%>
                      
                     <label class="checkp"> <%=Html.CheckBox("IsAllDayEvent", Model.IsAllDayEvent)%>全天事件</label>
                    </div>
                </label>
                 <label>
                    <span>
                        地点：
                    </span>
                    <% =Html.TextBox("Location", Model.Location, new { style = "width:95%;", MaxLength = "200" })%>
                </label>
                 <label>
                    <span>
                        备注：
                    </span>
                    <% =Html.TextArea("Description", Model.Description, new { style = "width:95%; height:70px" })%>
                </label>
                <%=Html.Hidden("timezone")%>
           <%} %>

         </div>
    <script src="<%=Url.Content("~/Javascripts/jquery.min.js")%>" type="text/javascript"></script>
    <script src="<%=Url.Content("~/Javascripts/Common.js")%>" type="text/javascript"></script>   
    <script src="<%=Url.Content("~/Javascripts/Plugins/jquery.form.js")%>" type="text/javascript"></script>
    <script src="<%=Url.Content("~/Javascripts/Plugins/jquery.validate.js")%>" type="text/javascript"></script>
    <script src="<%=Url.Content("~/Javascripts/Plugins/jquery.datepicker.js")%>" type="text/javascript"></script>
    <script src="<%=Url.Content("~/Javascripts/Plugins/jquery.dropdown.js")%>" type="text/javascript"></script>
    <script src="<%=Url.Content("~/Javascripts/Plugins/jquery.colorselect.js")%>" type="text/javascript"></script>
    <script type="text/javascript">
        $(document).ready(function() {
            //debugger;
            var arrT = [];
            var tt = "{0}:{1}";
            for (var i = 0; i < 24; i++) {
                arrT.push({ text: StrFormat(tt, [i >= 10 ? i : "0" + i, "00"]) }, { text: StrFormat(tt, [i >= 10 ? i : "0" + i, "30"]) });
            }
            $("#timezone").val(new Date().getTimezoneOffset()/60 * -1);
            $("#stparttime").dropdown({
                dropheight: 200,
                selectedchange: function() { },
                items: arrT
            });
            $("#etparttime").dropdown({
                dropheight: 200,
                selectedchange: function() { },
                items: arrT
            });
            var check = $("#IsAllDayEvent").click(function(e) {
                if (this.checked) {
                    $("#stparttime").val("00:00").hide();
                    $("#etparttime").val("00:00").hide();
                }
                else {
                    var d = new Date();
                    var p = 60 - d.getMinutes();
                    if (p > 30) p = p - 30;
                    d = DateAdd("n", p, d);
                    $("#stparttime").val(d.Format("HH:mm")).show();
                    $("#etparttime").val(DateAdd("h", 1, d).Format("HH:mm")).show();
                }
            });
            if (check[0].checked) {
                $("#stparttime").val("00:00").hide();
                $("#etparttime").val("00:00").hide();
            }
            $("#Savebtn").click(function() { $("#fmEdit").submit(); });
            $("#Closebtn").click(function() { CloseModelWindow(); });
            $("#Deletebtn").click(function() {
                 if (confirm("你确定要取消该日程吗？")) {  
                    var param = [{ "name": "calendarId", value: <%=Model.Id %>}];                
                    $.post("<%=Url.Action("QuickDeletePersonalCal")%>",
                        param,
                        function(data){
                              if (data.IsSuccess) {
                                    alert(data.Msg); 
                                    CloseModelWindow(null,true);                            
                                }
                                else {
                                    alert("操作失败：\r\n" + data.Msg);
                                }
                        }
                    ,"json");
                }
            });
            
           $("#stpartdate,#etpartdate").datepicker({ picker: "<button class='calpick'></button>"});    
            var cv =$("#colorvalue").val() ;
            if(cv=="")
            {
                cv="-1";
            }
            $("#calendarcolor").colorselect({ title: "颜色分类", index: cv, hiddenid: "colorvalue" });
            //定义ajaxform的调用参数
            var options = {
                beforeSubmit: function() {
                    return true;
                },
                dataType: "json",
                success: function(data) {
                    alert(data.Msg);
                    if (data.IsSuccess) {
                        CloseModelWindow(null,true);  
                    }
                }
            };
            $.validator.addMethod("date", function(value, element) {
                return this.optional(element) || /^(?:(?:1[6-9]|[2-9]\d)?\d{2}[\/\-\.](?:0?[1,3-9]|1[0-2])[\/\-\.](?:29|30))(?: (?:0?\d|1\d|2[0-3])\:(?:0?\d|[1-5]\d)\:(?:0?\d|[1-5]\d)(?: \d{1,3})?)?$|^(?:(?:1[6-9]|[2-9]\d)?\d{2}[\/\-\.](?:0?[1,3,5,7,8]|1[02])[\/\-\.]31)(?: (?:0?\d|1\d|2[0-3])\:(?:0?\d|[1-5]\d)\:(?:0?\d|[1-5]\d)(?: \d{1,3})?)?$|^(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])[\/\-\.]0?2[\/\-\.]29)(?: (?:0?\d|1\d|2[0-3])\:(?:0?\d|[1-5]\d)\:(?:0?\d|[1-5]\d)(?: \d{1,3})?)?$|^(?:(?:16|[2468][048]|[3579][26])00[\/\-\.]0?2[\/\-\.]29)(?: (?:0?\d|1\d|2[0-3])\:(?:0?\d|[1-5]\d)\:(?:0?\d|[1-5]\d)(?: \d{1,3})?)?$|^(?:(?:1[6-9]|[2-9]\d)?\d{2}[\/\-\.](?:0?[1-9]|1[0-2])[\/\-\.](?:0?[1-9]|1\d|2[0-8]))(?: (?:0?\d|1\d|2[0-3])\:(?:0?\d|[1-5]\d)\:(?:0?\d|[1-5]\d)(?:\d{1,3})?)?$/.test(value);
            }, "输入的日期格式不正确");
            $.validator.addMethod("time", function(value, element) {
                return this.optional(element) || /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/.test(value);
            }, "输入的时间格式不正确");
            $.validator.addMethod("safe", function(value, element) {
                return this.optional(element) || /^[^$\<\>]+$/.test(value);
            }, "不能包含以下符号: $<>");
            $("#fmEdit").validate({
                submitHandler: function(form) { $("#fmEdit").ajaxSubmit(options); },
                errorElement: "div",
                errorClass: "cusErrorPanel",
                errorPlacement: function(error, element) {
                    showerror(error, element);
                }
            });
            function showerror(error, target) {
                var pos = target.position();
                var height = target.height();
                var newpos = { left: pos.left, top: pos.top + height + 2 }
                var form = $("#fmEdit");             
                error.appendTo(form).css(newpos);
            }
        });
    </script>
    </div>
</body>
</html>

