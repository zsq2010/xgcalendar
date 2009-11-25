<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Index.aspx" Inherits="System.Web.Mvc.ViewPage" %>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head id="Head1">
    <title>我的日程</title>
    <link href="<%=Url.Content("~/Theme/Default/main.css") %>" rel="stylesheet" type="text/css" />   
    <link href="<%=Url.Content("~/Theme/Default/calendar.css") %>" rel="stylesheet" type="text/css" /> 
</head>
<body>
    <div>
      <div id="calhead" style="padding-left:1px;padding-right:1px;">          
            <div class="cHead"><div class="ftitle">我的日程</div>
            <div id="loadingpannel" class="ptogtitle loadicon" style="display: none;">正在加载数据...</div>
             <div id="errorpannel" class="ptogtitle loaderror" style="display: none;">非常抱歉，无法加载您的活动，请稍后再试</div>
            </div>
           
            
            <div id="caltoolbar" class="ctoolbar">
              <div id="faddbtn" class="fbutton">
                <div><span title='点击新建日程' class="addcal">新建日程</span></div>
            </div>
            <div class="btnseparator"></div>
             <div id="showtodaybtn" class="fbutton">
                <div><span title='点击返回当前日期' class="showtoday">今天</span></div>
            </div>
              <div class="btnseparator"></div>
            <div id="showdaybtn" class="fbutton">
                <div><span title='点击切换到日视图' class="showdayview">日</span></div>
            </div>
              <div  id="showweekbtn" class="fbutton fcurrent">
                <div><span title='点击切换到周视图' class="showweekview">周</span></div>
            </div>
              <div  id="showmonthbtn" class="fbutton">
                <div><span title='点击切换到月视图' class="showmonthview">月</span></div>
            </div>
            <div class="btnseparator"></div>
              <div  id="showreflashbtn" class="fbutton">
                <div><span title='刷新' class="showdayflash">刷新</span></div>
                </div>
             <div class="btnseparator"></div>
            <div id="sfprevbtn" title="上一个"  class="fbutton">
              <span class="fprev"></span>
            </div>
            <div id="sfnextbtn" title="下一个" class="fbutton">
                <span class="fnext"></span>
            </div>
            <div class="fshowdatep">
                <div><span id="txtdatetimeshow">Loading</span></div>
            </div>
            <div class="clear"></div>
            </div>
      </div>
      <div style="padding:1px;">
        <div class="t1 chromeColor">
            &nbsp;</div>
        <div class="t2 chromeColor">
            &nbsp;</div>
        <div id="dvCalMain" class="calmain printborder">
            <div id="gridcontainer" style="overflow-y: visible;">
            </div>
        </div>
        <div class="t2 chromeColor">
            &nbsp;</div>
        <div class="t1 chromeColor">
            &nbsp;
        </div>   
        </div>
     
  </div>
    <script src="<%=Url.Content("~/Javascripts/jquery.min.js")%>" type="text/javascript"></script>  
    <script src="<%=Url.Content("~/Javascripts/Common.js")%>" type="text/javascript"></script>
    <script src="<%=Url.Content("~/Javascripts/Plugins/jquery.calendar.js")%>" type="text/javascript"></script>
    <script type="text/javascript">
        $(document).ready(function() {
            //[id,title,start,end，全天日程，跨日日程,循环日程]            

            var op = {
                view: "week",
                showday: new Date(),
                EditCmdhandler: Edit,
                ViewCmdhandler: View,
                onBeforeRequestData: cal_beforerequest,
                onAfterRequestData: cal_afterrequest,
                onRequestDataError: cal_onerror,
                url: "",
                quickAddUrl: "", //快速添加日程Post Url 地址
                quickDeleteUrl: ""//快速删除日程的              
            };
            var $dv = $("#calhead");
            var _MH = document.documentElement.clientHeight;
            var dvH = $dv.height() + 2;
            op.height = _MH - dvH;
            op.eventItems = []; //__CURRENTDATA;

            var p = $("#gridcontainer").bcalendar(op).BcalGetOp();
            if (p && p.datestrshow) {
                $("#txtdatetimeshow").text(p.datestrshow);
            }
            $("#caltoolbar").noSelect();

            function cal_beforerequest(type) {
                switch (type) {
                    case 1:
                        $("#loadingpannel").show();
                        break;
                }
            }
            function cal_afterrequest(type) {
                switch (type) {
                    case 1:
                        $("#loadingpannel").hide();
                        break;
                }
                $("#errorpannel").hide();
            }
            function cal_onerror(data) {
                $("#errorpannel").show();
            }
            function Edit(data) {
                var eurl = "{0}?start={2}&isallday={4}";
                if (data) {
                    var url = StrFormat(eurl, data);
                    //OpenModelWindow(url,{ width: 600, height: 400, caption: "管理日程"});
                }
            }
            function View(data) {
                var vurl = "{0}";
                if (data) {
                    var url = StrFormat(vurl, data);
                    //OpenModelWindow(url,{ width: 600, height: 400, caption: "查看日程"});
                }

            }
            //显示日视图
            $("#showdaybtn").click(function(e) {
                $("#caltoolbar div.fcurrent").each(function() {
                    $(this).removeClass("fcurrent");
                })
                $(this).addClass("fcurrent");
                var p = $("#gridcontainer").BCalSwtichview("day").BcalGetOp();
                if (p && p.datestrshow) {
                    $("#txtdatetimeshow").text(p.datestrshow);
                }
            });
            //显示周视图
            $("#showweekbtn").click(function(e) {
                $("#caltoolbar div.fcurrent").each(function() {
                    $(this).removeClass("fcurrent");
                })
                $(this).addClass("fcurrent");
                var p = $("#gridcontainer").BCalSwtichview("week").BcalGetOp();
                if (p && p.datestrshow) {
                    $("#txtdatetimeshow").text(p.datestrshow);
                }

            });
            //显示月视图
            $("#showmonthbtn").click(function(e) {
                $("#caltoolbar div.fcurrent").each(function() {
                    $(this).removeClass("fcurrent");
                })
                $(this).addClass("fcurrent");
                var p = $("#gridcontainer").BCalSwtichview("month").BcalGetOp();
                if (p && p.datestrshow) {
                    $("#txtdatetimeshow").text(p.datestrshow);
                }
            });

            $("#showreflashbtn").click(function(e) {
                $("#gridcontainer").BCalReload();
            });

            //点击新增日程
            $("#faddbtn").click(function(e) {
                var url = "";
                alert("没有实现");
                //OpenModelWindow(url,{ width: 400, height: 400, caption: "新增日程"});
            });
            //点击回到今天
            $("#showtodaybtn").click(function(e) {
                var p = $("#gridcontainer").BCalGoToday().BcalGetOp();
                if (p && p.datestrshow) {
                    $("#txtdatetimeshow").text(p.datestrshow);
                }


            });
            //上一个
            $("#sfprevbtn").click(function(e) {
                var p = $("#gridcontainer").BCalPrev().BcalGetOp();
                if (p && p.datestrshow) {
                    $("#txtdatetimeshow").text(p.datestrshow);
                }

            });
            //下一个
            $("#sfnextbtn").click(function(e) {
                var p = $("#gridcontainer").BCalNext().BcalGetOp();
                if (p && p.datestrshow) {
                    $("#txtdatetimeshow").text(p.datestrshow);
                }
            });

        });
    </script>
</body>
</html>