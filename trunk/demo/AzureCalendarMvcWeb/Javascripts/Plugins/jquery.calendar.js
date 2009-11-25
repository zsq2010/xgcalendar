/// <reference path="../intellisense/jquery-1.2.6-vsdoc-cn.js" />
/// <reference path="../lib/blackbird.js" />
(function($) {
    $.fn.bcalendar = function(option) {
        var def = {
            view: "week", //默认是周视图day,week,month 
            weekstartday: 1,  //默认星期一开始
            theme: 0, //默认使用第三套主题
            height: false,
            url: "", //请求数据的Url         
            eventItems: [],
            method: "POST",
            showday: new Date(),
            onBeforeRequestData: false,
            onAfterRequestData: false,
            onRequestDataError: false,
            onItemCreateHandler: false,
            onItemDeleteHandler: false,
            onWeekToDay: false,
            quickAddHandler: false, //快速添加的拦截函数，该参数设置后quickAddUrl参数的设置将被忽略
            quickAddUrl: "", //快速添加日程Post Url 地址
			quickUpdateUrl:"",
            quickDeleteUrl: "", //快速删除日程的
            editUrl: "", //编辑或新增页面
            viewUrl: "", //查看
            addHandler: false,
            autoload: false,
            readonly: false,
            extParam: [],
			enableDrag:true,
            loadDateR: []
        };   

		var eventDiv = $("#gridEvent");
        if (eventDiv.length == 0) {
            eventDiv = $("<div id='gridEvent' style='display:none;'></div>").appendTo(document.body);
        }
        var gridcontainer = $(this);
        option = $.extend(def, option);
		if(option.quickUpdateUrl==null || option.quickUpdateUrl =="")
		{
			option.enableDrag=false;
		}
        //日历控件
        var __CHNUM = new Array('日', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十');
        var __SCOLLEVENTTEMP = "<DIV style=\"WIDTH:${width};top:${top};left:${left};\" title=\"${title}\" class=\"chip chip${i} ${drag}\"><div class=\"dhdV\" style=\"display:none\">${data}</div><DIV style=\"BORDER-BOTTOM-COLOR:${bdcolor}\" class=ct>&nbsp;</DIV><DL style=\"BORDER-BOTTOM-COLOR:${bdcolor}; BACKGROUND-COLOR:${bgcolor1}; BORDER-TOP-COLOR: ${bdcolor}; HEIGHT: ${height}px; BORDER-RIGHT-COLOR:${bdcolor}; BORDER-LEFT-COLOR:${bdcolor}\"><DT style=\"BACKGROUND-COLOR:${bgcolor2}\">${starttime} – ${endtime} ${icon}</DT><DD><SPAN>${content}</SPAN></DD><DIV class='resizer' style='display:${redisplay}'><DIV class=rszr_icon>&nbsp;</DIV></DIV></DL><DIV style=\"BORDER-BOTTOM-COLOR:${bdcolor}; BACKGROUND-COLOR:${bgcolor1}; BORDER-TOP-COLOR: ${bdcolor}; BORDER-RIGHT-COLOR: ${bdcolor}; BORDER-LEFT-COLOR:${bdcolor}\" class=cb1>&nbsp;</DIV><DIV style=\"BORDER-BOTTOM-COLOR:${bdcolor}; BORDER-TOP-COLOR:${bdcolor}; BORDER-RIGHT-COLOR:${bdcolor}; BORDER-LEFT-COLOR:${bdcolor}\" class=cb2>&nbsp;</DIV></DIV>";
        var __ALLDAYEVENTTEMP = '<div class="rb-o ${eclass}" id="${id}" title="${title}" style="color:${color};"><div class="dhdV" style="display:none">${data}</div><div class="${extendClass} rb-m" style="background-color:${color}">${extendHTML}<div class="rb-i">${content}</div></div></div>';
        var __MonthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
		var __LASSOTEMP = "<div class='drag-lasso' style='left:${left}px;top:${top}px;width:${width}px;height:${height}px;'>&nbsp;</div>";
		var _vresize;
		var _movee;
		var _movew;
		var _movem;
        //清空
        gridcontainer.empty();
        if (!option.height) {
            option.height = document.documentElement.clientHeight;
        }
        //初始化高度
        gridcontainer.css("overflow-y", "visible").height(option.height - 8);

        if (option.url && option.autoload) {
            populate(); //访问数据
        }
        else {
            var nc = { view: option.view, weekstartday: option.weekstartday, theme: option.theme };
            render(option.view, option.showday, option.eventItems, nc); //
            nc = null;
            var d = getRdate();
            pushER(d.start, d.end);
        }
        function render(viewType, showday, events, config) {
			//log.trace("视图生成开始，视图类型："+viewType);
            showday = new Date(showday.getFullYear(), showday.getMonth(), showday.getDate());
            if (viewType == "day" || viewType == "week") {
                var $dvtec = $("#dvtec");
                if ($dvtec.length > 0) {
                    option.scoll = $dvtec.attr("scrollTop");
                }
            }
            switch (viewType) {
                case "day":
                    BuildDaysAndWeekView(showday, 1, events, config);
                    break;
                case "week":
                    BuildDaysAndWeekView(showday, 7, events, config);
                    break;
                case "month":
                    BuildMonthView(showday, events, config);
                    break;
                default:
                    alert("没有实现");
                    break;
            }
            initevents(viewType);
            ResizeView();
			//log.diff("视图生成结束");
        }
		$(document)
		.mousemove(dragMove)
		.mouseup(dragEnd);
		$(document.body).hover(function(){},dragEnd); //移出页面则拖动事件停止
        function initevents(viewtype) {	
            if (viewtype == "week" || viewtype == "day") {
				//单日的日程时事件
                $("div.chip", gridcontainer).each(function(i) {
					var me = $(this);
					me.click(dayshow);
					if(option.enableDrag)
					{
						if(me.hasClass("drag"))
						{
							var re=me.mousedown(function(e)
							{
								dragStart("movee",e,$(this));					
								return false;
							}).find("div.resizer");					
							if( re.length==1 && re.css("display") !="none")
							{
								re.mousedown(function(e){							
									dragStart("vresize",e,$(this).parent());
									return false;});
							}
						}
					}
                });		
				
				$("td.tg-col",gridcontainer).each(function(i){
					$(this).click(function(e){					
						quickAddHandler.call(this, this.abbr, this.axis,e);
						return false;
					});
				});/**/
				if(viewtype=="week")
				{
					$("th.gcweekname",gridcontainer).each(function(i){
						$(this).click(WeekToDay);
					});
					if(option.enableDrag)
					{
						$("div.rb-o", gridcontainer).each(function(i){
							if($(this).hasClass("drag"))
							{
								$(this).mousedown(function(e)
								{
									dragStart("movew",e,$(this));					
									return false;
								});
							}
						});	
					}
				}
				
            }
			if(viewtype == "month" ) //more
			{
				$("div.month-row",gridcontainer).each(function(i){
					$(this).click(RowHandler);
				});	
				if(option.enableDrag)
				{
					$("div.rb-o",gridcontainer).each(function(i){
						if($(this).hasClass("drag"))
						{
							$(this).mousedown(function(e)
							{
								dragStart("movem",e,$(this));					
								return false;
							});
						}
					});	
				}
				
			}			
        }
		function dragStart(type,e,obj)
		{		
			if(type =="vresize")
			{							
				_vresize = { h: obj.height(), sy: e.pageY,chip:obj };
				$('body').css("cursor","s-resize");
			}
			if(type=="movee")
			{		
				var t= parseInt(obj.css("top"));
				var p=obj.parent();			
				var pos=p.offset();
				var w=p.width()+10;			
				var overId=p.attr("id");
				var di = parseInt(overId.replace("tgCol","")); //所在哪一天
				_movee = { top:t, sy: e.pageY,sx:e.pageX,chip:obj,pXMin:pos.left,pXMax:pos.left+w,pw:w,fdi:di,cdi:di };
				//log.info("(y:"+t+",pageX:"+e.pageX+")");
				t=p=w=pos=null;
			}
			if(type=="movew")
			{				
				var p = obj.parent(); // td
				var tp =p.parent().parent(); //tbody			
				var tpos = tp.offset();	
				var pos = p.offset();
				var h =tp.height();
				var t = tpos.top+h-17;
				var tw = tp.width();
				var l = tp.children(":last-child").children().length;
				var ys= tw%l;
				var ss = parseInt(tw/l);
				if(ys>l-2)
				{
					ss++;
				}
				var a=[]; 
				var di=-1;
				for(var i=0;i<l ;i++)
				{
					a.push({s:i*ss+tpos.left,e:(i+1)*ss+tpos.left});
					if(pos.left>=(i*ss+tpos.left) && pos.left<= ((i+1)*ss+tpos.left))
					{
						di=i;
						//log.debug("di="+di);
					}
					//log.info("s="+(i*ss+tpos.left)+",e="+((i+1)*ss+tpos.left));
				}				
				_movew={ area:a,ptop:tpos.top,top:t,sy: e.pageY,sx:e.pageX,chip:obj,pw:ss,ph:h,fdi:di,cdi:di};
			}
			if(type=="movem")
			{
				var a = [];
				var b = [];
				var mv= $("#mvrow_0");
				var tds = mv.find("td.st-bg");
				var pos =mv.offset();
				var op = obj.offset();
				var mh=$("#gridcontainer").height();
				var w=mv.outerWidth();
				var hl = mv.parent().children().length;			
				var h= parseInt(mh/hl)-1;
				var xi,yi=-1;
				var pd =0;		
				var tdl=tds.length;
				var ss;
				for(var i=0;i<tdl ;i++)
				{		
					var tw = $(tds[i]).outerWidth();
					if(!ss)
					{
						ss = tw-2;
					}
					var ts =  i==0?pos.left:a[i-1].e;
					var te = tw+ts;
					a.push({s:ts,e:te,w:tw});
					if( op.left>= ts && op.left < te )
					{
						xi=i;
					}
					//log.info("xs="+ts+",xe="+te);
					tw=ts=te=null;
				}
				for(var i=0;i<hl;i++)
				{
					b.push({s:i*h+pos.top,e:(i+1)*h+pos.top});
					if( op.top> (i*h+pos.top) && op.top < ((i+1)*h+pos.top) )
					{
						yi=i;
					}
					//log.info("ys="+(i*h+pos.top)+",ye="+((i+1)*h+pos.top));	
				}				
				_movem={xarea:a,yarea:b,sy: e.pageY,sx:e.pageX,chip:obj,h:h,fdi:yi*7+xi,w:ss};
				//log.info("fdi="+_movem.fdi);
			}
			$('body').noSelect();
		}
		function dragMove(e)
		{			
			if(_vresize)
			{	 
				 var v =_vresize;
				 var y = e.pageY;
                 var diff = y - v.sy;
				 var newH = v.h + diff;
				 fixchipheight(v.chip,newH);
				 v =null;
				 return false;
			}
			if(_movee)
			{
				 var m =_movee;				
				 var y = e.pageY;
				 var x = e.pageX;
				 var yd = y-m.sy;
				 var xd = x-m.sx;
				 var pd=0;				
				 if(x<m.pXMin)
				 {
					pd=-1;						
				 }
				 else if(x>m.pXMax)
				 {
					pd=1;
				 }
				 if(yd>=5 ||yd<=-5 || xd<=-5 || xd>=5)  //小晃动不算
				 {
					 var ny =m.top+yd;			 
					 if( m.cpwrap ==null ||  m.cpwrap==undefined)
					 {							
						var cp=m.chip.clone();
						m.chip.hide();					         
						var cpwrap = $("<div class='ca-evpi drag-chip-wrapper' style='top:"+ny+"px'/>");
						cp.addClass("drag-chip").css({top:"0px",left:"0%",width:"100%"}).appendTo(cpwrap);
						m.cpwrap = cpwrap;
						$("#tgOver"+m.cdi).append(cpwrap);
						cpwrap=null;
					 }	
					 if(pd!=0)
					 {
						//log.info("pd="+pd);
						m.cdi=m.cdi+pd;
						m.pXMin =m.pXMin+m.pw*pd;
						m.pXMax =m.pXMax+m.pw*pd;
						$("#tgOver"+m.cdi).append(m.cpwrap);
					 }
					 fixchipposition(m.cpwrap,ny);
				 }
				 m =null;				
				 return false;
			}
			if(_movew) //周的跨天和全体日程拖动
			{
				var m = _movew;
				var y = e.pageY;
				var x = e.pageX;
				var yd = y-m.sy;
				var xd = x-m.sx;			
				if(yd>=5 ||yd<=-5 || xd<=-5 || xd>=5)  //小晃动不算
				{						
					if(m.cpwrap ==null || m.cpwrap==undefined)
					{					
						var cp=m.chip.clone();
						var dvdata = $("div.dhdV", cp);
						var data = parseED(dvdata.text().split("$"));
						m.start= data[2];
						m.end = data[3];
						m.diff =DateDiff("d",m.start,m.end)+1; 
						var cpwrap = $("<div class='drag-event st-contents' style='width:"+(m.pw-4)+"px'/>").append(cp).appendTo(document.body);
						m.cpwrap= cpwrap;					
						var lc =$("<div style='Z-INDEX: 10;display:block' class='drag-lasso-container'/>");					
						$(document.body).append(lc);
						m.layer= lc;
						//Clear
						lc=dvdata=data=cpwrap=cs=cp=null;
					}					
					fixweekchipLayer(m, e.pageX, e.pageY);
				}
				m=null;
				return false;
			}
			if(_movem) //月视图拖动
			{
				var m = _movem;
				var y = e.pageY;
				var x = e.pageX;
				var yd = y-m.sy;
				var xd = x-m.sx;			
				if(yd>=5 ||yd<=-5 || xd<=-5 || xd>=5)  //小晃动不算
				{
					if(m.cpwrap ==null || m.cpwrap==undefined)
					{					
						var cp=m.chip.clone();
						var dvdata = $("div.dhdV", cp);	
						var data = parseED(dvdata.text().split("$"));
						m.start= data[2];
						m.end = data[3];
						m.diff =DateDiff("d",m.start,m.end)+1; 
						var w1= m.diff>1? (m.w-4)*1.5:(m.w-4);
						m.chw=w1;	
						if(m.diff>1)
						{
							cp.find("div.rb-i>span").prepend("("+m.diff+"天)&nbsp;");
						}
						var cpwrap = $("<div class='drag-event st-contents' style='width:"+w1+"px;'/>").append(cp).appendTo(document.body);
						m.cpwrap= cpwrap;					
						var lc =$("<div style='Z-INDEX: 10;display:block' class='drag-lasso-container'/>");					
						$(document.body).append(lc);
						m.layer= lc;
						//Clear
						w1=lc=dvdata=data=cpwrap=cs=cp=null;
					}	
					fixmonthchipLayer(m, e.pageX, e.pageY);
				}
				m=null;
				return false;
			}
			
			
		}
		function dragEnd(e)
		{				
			if(_vresize)
			{	 
				 var v =_vresize;	
				 var chip= v.chip;
				 var nh =$(chip).height();  
				 var oh = v.h;
				 $('body').css("cursor","default");
				 v =null;
				 _vresize=false;
				 if(nh !=oh)
				 {		
					var dh=nh-oh;
					var p =dh%21;
					var mi = parseInt(dh/21) ;
					if(p>10 || p<-10) //偏差值处理
					{
						if(mi<0 || p<0)
						{
							mi--;
						}
						else
						{
							mi++;
						}
					}
					mi=mi*30;
					dayupdate.call(chip.parent(),e,0,mi);
					chip=null;
				 }
				 return false;
			}
			if(_movee)
			{		
				var m=_movee;
				if(m.cpwrap)
				{
					var ot = m.top;
					var nt = parseInt(m.cpwrap.css("top"));
					var df =nt-ot;
					var p = df%21;
					var mi = parseInt(df/21) ;
					if(p>15 || p<-15) //偏差值处理
					{
						if(mi<0 || p<0)
						{
							mi--;
						}
						else
						{
						   mi++;
						}
					}
					var di = m.cdi-m.fdi;
					mi=mi*30+di*24*60;	
					if(mi!=0)
					{
						dayupdate.call(m.chip,e,mi,mi);
					}
					else
					{
						m.chip.show();
						m.cpwrap.remove();
					}
				}				
				m=_movee =null;
				return false;
			}
			if(_movew)
			{
				var m = _movew;
				if( m.cpwrap)
				{						
					var nd = DateAdd("d",m.cdi,option.vstart);
					var di = DateDiff("d",m.start,nd);
					var mi=di*24*60;	
					if(mi!=0)
					{
						dayupdate.call(m.chip,e,mi,mi);
					}				
					m.cpwrap.remove();
					m.layer.remove();
				}
				m=_movew =null;
				return false;
			}
			if(_movem)
			{
				var m=_movem;
				if( m.cpwrap)
				{
					var nd = DateAdd("d",m.cdi,option.vstart);
					var di = DateDiff("d",m.start,nd);
					var mi=di*24*60;	
					if(mi!=0)
					{
						dayupdate.call(m.chip,e,mi,mi);
					}		
					m.cpwrap.remove();
					m.layer.remove();
				}
				m=_movem =null;
				return false;
			}
			$('body').noSelect(false);
			
		}
		function fixmonthchipLayer(md,x,y)
		{
			var index=-1;
			var xi=-1;
			var yi = -1;
			var l = md.xarea.length;
			var h = md.yarea.length;
			for(var i=0;i<l;i++)
			{
				if(x> md.xarea[i].s && x<= md.xarea[i].e)
				{
					xi =i;
					break;
				}
			}
			for(var i=0;i<h;i++)
			{
				if(y> md.yarea[i].s && y<= md.yarea[i].e)
				{
					yi = i;
					break;
				}
			}			
			
			index = yi*7+xi;		  
			if(index>=0 && xi>=0 && yi>=0)
			{				
				if( md.fdi==null || md.fdi ==undefined) 
				{
					md.fdi=index;
				}
				x=x-60;
				if(x+md.chw>=md.xarea[l-1].e)
				{
					x = md.xarea[l-1].e - md.chw-1 ;
				}
				if(y+21>=md.yarea[h-1].e)
				{
					y = md.yarea[h-1].e-22;
				}
				md.cpwrap.css({left:x+"px",top:y+"px"});
				if(md.cdi!=index)
				{
					//log.info("index="+index);
					md.cdi=index;						
					//遮盖
					var ld = md.diff;
					var ii = xi;
					var jj = yi;
					var play =[];
					var max=document.documentElement.clientWidth;
					while(jj<h && ld>0)
					{					
						var d = ld+ii>l?l-ii:ld;					
						var left = md.xarea[ii].s;						
						var wid = md.xarea[ii].w*d-1;							
						while(left+wid>=max)
						{
							wid--;
						}
						play.push(Tp(__LASSOTEMP,{left:left,top:md.yarea[jj].s,height:md.h,width:wid}));
						ii=0;
						ld=ld-d;
						jj++;
					}
					md.layer.html(play.join(""));	
					ld=ii=jj=play=null;
				}
			}
			md=null;
		}
		function fixweekchipLayer(md,x,y)
		{			
			//计算鼠标的区间
			var index=-1;
			var l=md.area.length;
			for(var i=0;i<l;i++)
			{
				if(x> md.area[i].s && x<= md.area[i].e)
				{
					index =i;
					break;
				}
			}
			if(index !=-1)
			{
				
				if(md.cdi !=index || md.fdi==index )
				{
					md.cdi=index;
					var pos = md.area[index];				
					md.cpwrap.css({left:pos.s+4,top:md.top});			
					var d = md.diff+index>l?l-index:md.diff;	
					var htm=Tp(__LASSOTEMP,{left:pos.s,width:d*md.pw+2,height:md.ph,top:md.ptop});				
					md.layer.html(htm);
					pos=null;	
				}
				if( md.fdi==null || md.fdi ==undefined) 
				{
					md.fdi=index;
				}
			}
			md=null;
		}
		function fixchipheight(chip,nh)
		{
			if(nh>0)
			{			
				nh=nh-(nh+4) % 21;
				if(nh>0)
				{					
					$(chip).height(nh);
				}
			}
		}
		function fixchipposition(chip,top)
		{			
			if(top>0)
			{				
				var p= top % 21;
				top = top-p;
				if(p>=10)
				{
					top=top+21;
				}
				//log.info("top="+top);
				$(chip).css("top",top);
			}
		}
        function rerender() {
            var nc = { view: option.view, weekstartday: option.weekstartday, theme: option.theme };
            render(option.view, option.showday, option.eventItems, nc); //
            nc = null;
        }
        function clearcontainer() {
            gridcontainer.empty();
        }
        //发起ajax请求
        function populate() {
            if (option.isloading) {
                return true;
            }
            if (option.url && option.url != "") {
                option.isloading = true;
                //clearcontainer();
                if (option.onBeforeRequestData && $.isFunction(option.onBeforeRequestData)) {
                    option.onBeforeRequestData(1);
                }
                var param = [
                { name: "showdate", value: option.showday.Format("yyyy-MM-dd") },
                { name: "viewtype", value: option.view }
                ];
                if (option.extParam) {
                    for (var pi = 0; pi < option.extParam.length; pi++) {
                        param[param.length] = option.extParam[pi];
                    }
                }
                $.ajax({
                    type: option.method, //
                    url: option.url,
                    data: param,
                    dataType: "json",
                    dataFilter: function(data, type) {
                        return data.replace(/"\\\/(Date\([0-9-]+\))\\\/"/gi, 'new $1');
                    },
                    success: function(data) {
                        if (data != null && data.error != null) {
                            if (option.onRequestDataError) {
                                option.onRequestDataError(1, data);
                            }
                        }
                        else {
                            responseData(data);
                            pushER(data.start, data.end);
                        }
                        if (option.onAfterRequestData && $.isFunction(option.onAfterRequestData)) {
                            option.onAfterRequestData(1);
                        }
                        option.isloading = false;
                    },
                    error: function(data) {
                        try {
                            if (option.onRequestDataError) {
                                option.onRequestDataError(1, data);
                            } else {
                                alert("获取数据发生异常;");
                            }
                            if (option.onAfterRequestData && $.isFunction(option.onAfterRequestData)) {
                                option.onAfterRequestData(1);
                            }
                            option.isloading = false;
                        } catch (e) { }
                    }
                });
            }
            else {
                alert("url参数未配置");
            }
        }
        function ConcatEvents(events) {
            if (events && events.length > 0) {
                if (option.eventItems.length == 0) {
                    return events;
                }
                else {
                    var l = events.length;
                    var sl = option.eventItems.length;
                    var sI = 0;
                    var eI = sl;
                    var s = events[0][2];
                    s = new Date(s.getFullYear(), s.getMonth(), s.getDate());
                    var e = events[l - 1][2];
                    if (option.eventItems[0][2] > e) // 第一个的开始时间都要大于请求的最后一个的开始时间
                    {
                        option.eventItems = events.concat(option.eventItems);
                        return;
                    }
                    if (option.eventItems[sl - 1][2] < s) // 最后一个的开始时间都要小于请求的第一个的开始时间
                    {
                        option.eventItems = option.eventItems.concat(events);
                        return;
                    }
                    for (var i = 0; i < sl; i++) {
                        if (option.eventItems[i][2] >= s && sI == 0) {
                            sI = i;
                            continue;
                        }
                        if (option.eventItems[i][2] > e) {
                            eI = i;
                            break
                        }
                    }
                    option.eventItems = [].concat(option.eventItems.slice(0, sI - 1), events, option.eventItems.slice(eI));
                }
            }
        }
        function rebyKey(key,remove) {
            if (option.eventItems && option.eventItems.length > 0) {
                var sl = option.eventItems.length;
                var i = -1;
                for (var j = 0; j < sl; j++) {
                    if (option.eventItems[j][0] == key) {
                        i = j;
                        break;
                    }
                }
                if (i >= 0) {
                    var t = option.eventItems[i];
					if(remove)
					{
						option.eventItems.splice(i, 1);
					}
                    return t;
                }
            }
            return null;
        }
        function Ind(event, i) {
            var d = 0;
            if (!i) {
                if (option.eventItems && option.eventItems.length > 0) {
                    var sl = option.eventItems.length;
                    var s = event[2];
                    var d1 = s.getTime() - option.eventItems[0][2].getTime();
                    var d2 = option.eventItems[sl - 1][2].getTime() - s.getTime();
                    var diff = d1 - d2;
                    if (d1 < 0 || diff < 0) {
                        for (var j = 0; j < sl; j++) {
                            if (option.eventItems[j][2] >= s) {
                                i = j;
                                break;
                            }
                        }
                    }
                    else if (d2 < 0) {
                        i = sl;
                    }
                    else {
                        for (var j = sl - 1; j >= 0; j--) {
                            if (option.eventItems[j][2] < s) {
                                i = j + 1;
                                break;
                            }
                        }
                    }
                }
                else {
                    i = 0;
                }
            }
            else {
                d = 1;
            }
            if (option.eventItems && option.eventItems.length > 0) {
                if (i == option.eventItems.length) {
                    option.eventItems.push(event);
                }
                else { option.eventItems.splice(i, d, event); }
            }
            else {
                option.eventItems = [event];
            }
            return i;
        }
        function dochange() {         
            var d = getRdate();
            var loaded = checkInEr(d.start, d.end);
            if (!loaded) {
                populate();
            }
        }
        function getRdate() {
            var showday = option.showday;
            var viewType = option.view;
            var sd, ed;
            switch (viewType) {
                case "day":
                    sd = showday;
                    ed = showday;
                case "week":
                    var w = option.weekstartday - showday.getDay();
                    if (w > 0) {
                        w = w - 7;
                    }
                    sd = DateAdd("d", w, showday);
                    ed = DateAdd("d", 6, sd);
                    break;
                case "month":
                    var firstdate = new Date(showday.getFullYear(), showday.getMonth(), 1);
                    var diffday = option.weekstartday - firstdate.getDay();
                    var showmonth = showday.getMonth();
                    if (diffday > 0) {
                        diffday -= 7;
                    }
                    var sd = DateAdd("d", diffday, firstdate);
                    var ed = DateAdd("d", 34, sd);
                    if (ed.getFullYear() == showday.getFullYear() && ed.getMonth() == showday.getMonth() && ed.getDate() < __MonthDays[showmonth]) {
                        ed = DateAdd("d", 7, ed);
                    }
                    break;
            }
            return { start: sd, end: ed };
        }
        function checkInEr(start, end) {
            var ll = option.loadDateR.length;
            if (ll == 0) {
                return false;
            }
            var r = false;
            var r2 = false;
            for (var i = 0; i < ll; i++) {
                r = false, r2 = false;
                var dr = option.loadDateR[i];
                if (start >= dr.startdate && start <= dr.enddate) {
                    r = true;
                }
                if (start.Format("yyyyMMdd") == dr.startdate.Format("yyyyMMdd") || start.Format("yyyyMMdd") == dr.enddate.Format("yyyyMMdd")) {
                    r = true;
                }
                if (!end)
                { r2 = true; }
                else {
                    if (end >= dr.startdate && end <= dr.enddate) {
                        r2 = true;
                    }
                    if (end.Format("yyyyMMdd") == dr.startdate.Format("yyyyMMdd") || end.Format("yyyyMMdd") == dr.enddate.Format("yyyyMMdd")) {
                        r2 = true;
                    }
                }
                if (r && r2) {
                    break;
                }
            }
            return r && r2;
        }
        function pushER(start, end) {
            var ll = option.loadDateR.length;
            if (!end) {
                end = start;
            }
            if (ll == 0) {
                option.loadDateR.push({ startdate: start, enddate: end });
            }
            else {
                for (var i = 0; i < ll; i++) {
                    var dr = option.loadDateR[i];
                    var diff = DateDiff("d", start, dr.startdate);
                    if (diff == 0 || diff == 1) {
                        if (dr.enddate < end) {
                            dr.enddate = end;
                        }
                        break;
                    }
                    else if (diff > 1) {
                        var d2 = DateDiff("d", end, dr.startdate);
                        if (d2 > 1) {
                            option.loadDateR.splice(0, 0, { startdate: start, enddate: end });
                        }
                        else {
                            dr.startdate = start;
                            if (dr.enddate < end) {
                                dr.enddate = end;
                            }
                        }
                        break;
                    }
                    else {
                        var d3 = DateDiff("d", end, dr.startdate);

                        if (dr.enddate < end) {
                            if (d3 < 1) {
                                dr.enddate = end;
                                break;
                            }
                            else {
                                if (i == ll - 1) {
                                    option.loadDateR.push({ startdate: start, enddate: end });
                                }
                            }
                        }
                    }
                }
                //end for
                //clear
                ll = option.loadDateR.length;
                if (ll > 1) {
                    for (var i = 0; i < ll - 1; ) {
                        var d1 = option.loadDateR[i];
                        var d2 = option.loadDateR[i + 1];

                        var diff1 = DateDiff("d", d2.startdate, d1.enddate);
                        if (diff1 <= 1) {
                            d1.startdate = d2.startdate > d1.startdate ? d1.startdate : d2.startdate;
                            d1.enddate = d2.enddate > d1.enddate ? d2.enddate : d1.enddate;
                            option.loadDateR.splice(i + 1, 1);
                            ll--;
                            continue;
                        }
                        i++;
                    }
                }
            }
        }
        //data:{viewtype:"",showday:"",events:[],issort:false};
        function responseData(data) {
            var events;
            if (data.issort == false) {
                if (data.events && data.events.length > 0) {
                    events = data.sort(function(l, r) { return l[2] > r[2] ? -1 : 1; });
                }
                else {
                    events = [];
                }
            }
            else {
                events = data.events;
            }
            ConcatEvents(events);
            //TODO:Rebuild Option.Events
            var nc = { view: option.view, weekstartday: option.weekstartday, theme: option.theme };
            render(option.view, option.showday, events, nc); //
            nc = null;
        }
        //构建日视图
        function BuildDaysAndWeekView(startday, l, events, config) {
            var days = [];
            if (l == 1) {
                var show = startday.Format("M/d (周") + __CHNUM[startday.getDay()] + ")";
                days.push({ display: show, date: startday, day: startday.getDate(), year: startday.getFullYear(), month: startday.getMonth() + 1 });
                option.datestrshow = CalDateShow(days[0].date);
				option.vstart = days[0].date;
				option.vend = days[0].date;
            }
            else {
                var w = 0;
                if (l == 7) {
                    w = config.weekstartday - startday.getDay();
                    if (w > 0) w = w - 7;
                }
                var ndate;
                for (var i = w, j = 0; j < l; i = i + 1, j++) {
                    ndate = DateAdd("d", i, startday);
                    var show = ndate.Format("M/d (周") + __CHNUM[ndate.getDay()] + ")";
                    days.push({ display: show, date: ndate, day: ndate.getDate(), year: ndate.getFullYear(), month: ndate.getMonth() + 1 });
                }
				option.vstart = days[0].date;
				option.vend = days[l - 1].date;
                option.datestrshow = CalDateShow(days[0].date, days[l - 1].date);
            }

            var allDayEvents = [];
            var scollDayEvents = [];

            //返回所有全天日程的个数,拆分日程分成全天跨天日程和当天日程；
            var dM = PropareEvents(days, events, allDayEvents, scollDayEvents);

            var html = [];
            html.push("<div id=\"dvwkcontaienr\" class=\"wktopcontainer\">");
            html.push("<table class=\"wk-top\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\">");
            BuildWT(html, days, allDayEvents, dM);
            html.push("</table>");
            html.push("</div>");

            //onclick=\"javascript:FunProxy('rowhandler',event,this);\"
            html.push("<div id=\"dvtec\"  class=\"scolltimeevent\"><table style=\"table-layout: fixed;", jQuery.browser.msie ? "" : "width:100%", "\" cellspacing=\"0\" cellpadding=\"0\"><tbody><tr><td>");
            html.push("<table style=\"height: 1008px\" id=\"tgTable\" class=\"tg-timedevents\" cellspacing=\"0\" cellpadding=\"0\"><tbody>");
            BuildDayScollEventContainer(html, days, scollDayEvents);
            html.push("</tbody></table></td></tr></tbody></table></div>");
            gridcontainer.html(html.join(""));
            html = null;
			$("#weekViewAllDaywk").click(RowHandler);
        }
        function BuildDayScollEventContainer(ht, dayarrs, events) {
            //1:
            ht.push("<tr>");
            ht.push("<td style='width:60px;'></td>");
            ht.push("<td");
            if (dayarrs.length > 1) {
                ht.push(" colSpan='", dayarrs.length, "'");
            }
            ht.push("><div id=\"tgspanningwrapper\" class=\"tg-spanningwrapper\"><div style=\"font-size: 20px\" class=\"tg-hourmarkers\">");
            for (var i = 0; i < 24; i++) {
                ht.push("<div class=\"tg-dualmarker\"></div>");
            }
            ht.push("</div></div></td></tr>");

            //2:
            ht.push("<tr>");
            ht.push("<td style=\"width: 60px\" class=\"tg-times\">");

            //计算当前时间的位置
            var now = new Date(); var h = now.getHours(); var m = now.getMinutes();
            var mHg = gP(h, m) - 4; //减去标志本身一半的高度，可以让箭头刚好指向目标位置
            ht.push("<div id=\"tgnowptr\" class=\"tg-nowptr\" style=\"left:0px;top:", mHg, "px\"></div>");
            var tmt = "";
            for (var i = 0; i < 24; i++) {
                tmt = fomartTimeShow(i);
                ht.push("<div style=\"height: 41px\" class=\"tg-time\">", tmt, "</div>");
            }
            ht.push("</td>");

            var l = dayarrs.length;
            for (var i = 0; i < l; i++) {
                ht.push("<td class=\"tg-col\" ch='qkadd' abbr='", dayarrs[i].date.Format("yyyy-M-d"), "'>");
                var istoday = dayarrs[i].date.Format("yyyyMMdd") == new Date().Format("yyyyMMdd");
                // Today
                if (istoday) {
                    ht.push("<div style=\"margin-bottom: -1008px; height:1008px\" class=\"tg-today\">&nbsp;</div>");
                }
                //var eventC = $(eventWrap);
                //onclick=\"javascript:FunProxy('rowhandler',event,this);\"
                ht.push("<div  style=\"margin-bottom: -1008px; height: 1008px\" id='tgCol",i,"' class=\"tg-col-eventwrapper\">");
                BuildEvents(ht, events[i], dayarrs[i]);
                ht.push("</div>");

                ht.push("<div class=\"tg-col-overlaywrapper\" id='tgOver",i,"'>");
                if (istoday) {
                    var mhh = mHg + 4;
                    ht.push("<div id=\"tgnowmarker\" class=\"tg-hourmarker tg-nowmarker\" style=\"left:0px;top:", mhh, "px\"></div>");
                }
                ht.push("</div>");
                ht.push("</td>");
            }
            ht.push("</tr>");
        }
        function BuildEvents(hv, events, sday) {

            for (var i = 0; i < events.length; i++) {
                var c;
                if (events[i].event[7] && events[i].event[7] >= 0) {
                    c = tc(events[i].event[7]);
                }
                else {
                    c = tc();
                }
                var tt = buildDayEvent(c, events[i],i);
                hv.push(tt);
            }

        }
        function buildDayEvent(theme, e,index) {

            var p = { bdcolor: theme[0], bgcolor2: theme[0], bgcolor1: theme[2], width: "70%", icon: "", title: "", data: "" };
            p.starttime = pZero(e.st.hour) + ":" + pZero(e.st.minute);
            p.endtime = pZero(e.et.hour) + ":" + pZero(e.et.minute);
            p.content = e.event[1];
            p.title = e.event[1];
            p.data = e.event.join("$");
            var icons = [];
            icons.push("<I class=\"cic cic-tmr\">&nbsp;</I>");
            if (e.reevent) {
                icons.push("<I class=\"cic cic-spcl\">&nbsp;</I>");
            }
            p.icon = icons.join("");
            var sP = gP(e.st.hour, e.st.minute);
            var eP = gP(e.et.hour, e.et.minute);
            p.top = sP + "px";
            p.left = (e.left * 100) + "%";
            p.width = (e.aQ * 100) + "%";
            p.height = (eP - sP - 4);
			p.i=index;
			if(option.enableDrag &&  e.event[8] ==1)
			{
				p.drag="drag";
				p.redisplay="block";
			}
			else
			{
				p.drag="";
				p.redisplay="none";
			}
            var newtemp = Tp(__SCOLLEVENTTEMP, p);
            p = null;
            return newtemp;
        }

        function BuildWT(ht, dayarrs, events, dMax) {
            //1:
            ht.push("<tr>", "<th width=\"60\" rowspan=\"3\">&nbsp;</th>");

            for (var i = 0; i < dayarrs.length; i++) {
                var ev, title, cl;
                if (dayarrs.length == 1) {
                    ev = "";
                    title = "";
                    cl = "";
                }
                else {
                    ev = ""; // "onclick=\"javascript:FunProxy('week2day',event,this);\"";
                    title = "点击转到该日期的日视图";
                    cl = "wk-daylink";
                }
                ht.push("<th abbr='", dayarrs[i].date.Format("yyyy-M-d"), "' class='gcweekname' scope=\"col\"><div title='", title, "' ", ev, " class='wk-dayname'><span class='", cl, "'>", dayarrs[i].display, "</span></div></th>");

            }
            ht.push("<th width=\"16\" rowspan=\"3\">&nbsp;</th>");
            ht.push("</tr>"); //end tr1;
            //2:          
            ht.push("<tr>");
            ht.push("<td class=\"wk-allday\"");

            if (dayarrs.length > 1) {
                ht.push(" colSpan='", dayarrs.length, "'");
            }
            //onclick=\"javascript:FunProxy('rowhandler',event,this);\"
            ht.push("><div id=\"weekViewAllDaywk\" ><table class=\"st-grid\" cellpadding=\"0\" cellspacing=\"0\"><tbody>");

            if (dMax == 0) {
                ht.push("<tr>");
                for (var i = 0; i < dayarrs.length; i++) {
                    ht.push("<td class=\"st-c st-s\"", " ch='qkadd' abbr='", dayarrs[i].date.Format("yyyy-M-d"), "' axis='00:00'>&nbsp;</td>");
                }
                ht.push("</tr>");
            }
            else {
                var l = events.length;
                var el = 0;
                var x = [];
                for (var j = 0; j < l; j++) {
                    x.push(0);
                }
                //var c = tc();
                for (var j = 0; el < dMax; j++) {
                    ht.push("<tr>");
                    for (var h = 0; h < l; ) {
                        var e = events[h][x[h]];
                        ht.push("<td class='st-c");
                        if (e) { //如果存在
                            x[h] = x[h] + 1;
                            ht.push("'");
                            var t = BuildMonthDayEvent(e, dayarrs[h].date, l - h);
                            if (e.colSpan > 1) {
                                ht.push(" colSpan='", e.colSpan, "'");
                                h += e.colSpan;
                            }
                            else {
                                h++;
                            }
                            ht.push(" ch='show'>", t);
                            t = null;
                            el++;
                        }
                        else {
                            ht.push(" st-s' ch='qkadd' abbr='", dayarrs[h].date.Format("yyyy-M-d"), "' axis='00:00'>&nbsp;");
                            h++;
                        }
                        ht.push("</td>");
                    }
                    ht.push("</tr>");
                }
                ht.push("<tr>");
                for (var h = 0; h < l; h++) {
                    ht.push("<td class='st-c st-s' ch='qkadd' abbr='", dayarrs[h].date.Format("yyyy-M-d"), "' axis='00:00'>&nbsp;</td>");
                }
                ht.push("</tr>");
            }
            ht.push("</tbody></table></div></td></tr>"); // stgrid end //wvAd end //td2 end //tr2 end
            //3:
            ht.push("<tr>");

            ht.push("<td style=\"height: 5px;\"");
            if (dayarrs.length > 1) {
                ht.push(" colSpan='", dayarrs.length, "'");
            }
            ht.push("></td>");
            ht.push("</tr>");
        }
        //切分一半的日程后，全天日程（包括跨日）
        function PropareEvents(dayarrs, events, aDE, sDE) {
            var l = dayarrs.length;
            var el = events.length;
            var fE = [];
            var deB = aDE;
            var deA = sDE;
            //debugger;
            for (var j = 0; j < el; j++) {
                var sD = events[j][2];
                var eD = events[j][3];
                var s = {};
                s.event = events[j];
                s.day = sD.getDate();
                s.year = sD.getFullYear();
                s.month = sD.getMonth() + 1;
                s.allday = events[j][4] == 1;
                s.crossday = events[j][5] == 1;
                s.reevent = events[j][6] == 1; //循环日程
                s.daystr = s.year + "/" + s.month + "/" + s.day;
                s.st = {};
                s.st.hour = sD.getHours();
                s.st.minute = sD.getMinutes();
                s.st.p = s.st.hour * 60 + s.st.minute; // 时间的开始位置
                s.et = {};
                s.et.hour = eD.getHours();
                s.et.minute = eD.getMinutes();
                s.et.p = s.et.hour * 60 + s.et.minute; // 时间的结束位置
                fE.push(s);
            }
            var dMax = 0;
            for (var i = 0; i < l; i++) {
                var da = dayarrs[i];
                deA[i] = []; deB[i] = [];
                da.daystr = da.year + "/" + da.month + "/" + da.day;
                for (var j = 0; j < fE.length; j++) {
                    if (!fE[j].crossday && !fE[j].allday) {
                        if (da.daystr == fE[j].daystr)
                            deA[i].push(fE[j]);
                    }
                    else {
                        if (da.daystr == fE[j].daystr) {
                            deB[i].push(fE[j]);
                            dMax++;
                        }
                        else {
                            if (i == 0 && da.date >= fE[j].event[2] && da.date <= fE[j].event[3])//跨日的第一个日程
                            {
                                deB[i].push(fE[j]);
                                dMax++;
                            }
                        }
                    }
                }
            }
            var lrdate = dayarrs[l - 1].date;
            for (var i = 0; i < l; i++) { //处理全天和跨日的日程
                var de = deB[i];
                if (de.length > 0) { //有日程           
                    for (var j = 0; j < de.length; j++) {
                        var end = DateDiff("d", lrdate, de[j].event[3]) > 0 ? lrdate : de[j].event[3];
                        de[j].colSpan = DateDiff("d", dayarrs[i].date, end) + 1
                    }
                }
                de = null;
            }
            //处理单日的日程      
            for (var i = 0; i < l; i++) {
                var de = deA[i];
                if (de.length > 0) { //存在日程
                    var x = []; //数组1
                    var y = []; // 数组2
                    var D = [];
                    var dl = de.length;
                    var Ia;
                    for (var j = 0; j < dl; ++j) {
                        var ge = de[j];
                        for (var La = ge.st.p, Ia = 0; y[Ia] > La; ) Ia++;
                        ge.PO = Ia; ge.ne = []; //PO是指前面有多少个日程
                        y[Ia] = ge.et.p || 1440;
                        x[Ia] = ge;
                        if (!D[Ia]) {
                            D[Ia] = [];
                        }
                        D[Ia].push(ge);
                        if (Ia != 0) {
                            ge.pe = [x[Ia - 1]]; //前面日程
                            x[Ia - 1].ne.push(ge); //后面日程
                        }
                        for (Ia = Ia + 1; y[Ia] <= La; ) Ia++;
                        if (x[Ia]) {
                            var k = x[Ia];
                            ge.ne.push(k);
                            k.pe.push(ge);
                        }
                        ge.width = 1 / (ge.PO + 1);
                        ge.left = 1 - ge.width;
                    }
                    var k = Array.prototype.concat.apply([], D);
                    /**/
                    x = y = D = null;
                    var t = k.length;
                    for (var y = t; y--; ) {
                        var H = 1;
                        var La = 0;
                        var x = k[y];
                        for (var D = x.ne.length; D--; ) {
                            var Ia = x.ne[D];
                            La = Math.max(La, Ia.VL);
                            H = Math.min(H, Ia.left)
                        }
                        x.VL = La + 1;
                        x.width = H / (x.PO + 1);
                        x.left = H - x.width;
                    }
                    for (var y = 0; y < t; y++) {
                        var x = k[y];
                        x.left = 0;
                        if (x.pe) for (var D = x.pe.length; D--; ) {
                            var H = x.pe[D];
                            x.left = Math.max(x.left, H.left + H.width);
                        }
                        var p = (1 - x.left) / x.VL;
                        x.width = Math.max(x.width, p);
                        x.aQ = Math.min(1 - x.left, x.width + 0.7 * p); //width的偏移
                    }
                    de = null;
                    deA[i] = k;
                }
            }
            return dMax;
        }
        function BuildMonthView(showday, events, config) {
            //onclick=\"javascript:FunProxy('rowhandler',event,this);\"
            //onclick=\"javascript:StopEventBubbling(event);\"
            var cc = "<div id='cal-month-cc' class='cc'><div id='cal-month-cc-header'><div class='cc-close' id='cal-month-closebtn'></div><div id='cal-month-cc-title' class='cc-title'></div></div><div id='cal-month-cc-body' class='cc-body'><div id='cal-month-cc-content' class='st-contents'><table class='st-grid' cellSpacing='0' cellPadding='0'><tbody></tbody></table></div></div></div>";
            var html = [];
            html.push(cc);
            //build header
            html.push("<div id=\"mvcontainer\" class=\"mv-container\">");
            html.push("<table id=\"mvweek\" class=\"mv-daynames-table\" cellSpacing=\"0\" cellPadding=\"0\"><tbody><tr>");
            for (var i = config.weekstartday, j = 0; j < 7; i++, j++) {
                if (i > 6) i = 0;
                var p = { dayname: "周" + __CHNUM[i] };
                html.push("<th class=\"mv-dayname\" title=\"", "周", __CHNUM[i], "\">周", __CHNUM[i], "");
            }
            html.push("</tr></tbody></table>");
            html.push("</div>");
            var bH = GetMonthViewBodyHeight() - GetMonthViewHeaderHeight();

            html.push("<div id=\"mvEventContainer\" class=\"mv-event-container\" style=\"height:", bH, "px;", "\">");
            BuilderMonthBody(html, showday, config.weekstartday, events, bH);
            html.push("</div>");
            gridcontainer.html(html.join(""));
            html = null;
			$("#cal-month-closebtn").click(closeCc);
        }
        //获取月视图body的高度
        function GetMonthViewBodyHeight() {
            return option.height;
        }
        function GetMonthViewHeaderHeight() {
            return 21;
        }
        function BuilderMonthBody(htb, showday, startday, events, bodyHeight) {

            var firstdate = new Date(showday.getFullYear(), showday.getMonth(), 1);
            var diffday = startday - firstdate.getDay();
            var showmonth = showday.getMonth();
            if (diffday > 0) {
                diffday -= 7;
            }
            var startdate = DateAdd("d", diffday, firstdate);
            var enddate = DateAdd("d", 34, startdate);
            var rc = 5;

            if (enddate.getFullYear() == showday.getFullYear() && enddate.getMonth() == showday.getMonth() && enddate.getDate() < __MonthDays[showmonth]) {
                enddate = DateAdd("d", 7, enddate);
                rc = 6;
            }
			option.vstart =startdate;
			option.vend =enddate;
            option.datestrshow = CalDateShow(startdate, enddate);
            bodyHeight = bodyHeight - 18 * rc;
            var rowheight = bodyHeight / rc;
            var roweventcount = parseInt(rowheight / 21);
            if (rowheight % 21 > 15) {
                roweventcount++;
            }
            var p = 100 / rc;
            var formatevents = [];
            var hastdata = formartEventsInHashtable(events, startday, 7, startdate, enddate);
            var B = [];
            var C = [];
            for (var j = 0; j < rc; j++) {
                var k = 0;
                formatevents[j] = b = [];
                for (var i = 0; i < 7; i++) {
                    var newkeyDate = DateAdd("d", j * 7 + i, startdate);
                    C[j * 7 + i] = newkeyDate;
                    var newkey = newkeyDate.Format("yyyyMMdd");
                    b[i] = hastdata[newkey];
                    if (b[i] && b[i].length > 0) {
                        k += b[i].length;
                    }
                }
                B[j] = k;
            }
            //var c = tc();
            eventDiv.data("mvdata", formatevents);
            for (var j = 0; j < rc; j++) {
                //onclick=\"javascript:FunProxy('rowhandler',event,this);\"
                htb.push("<div id='mvrow_", j, "' style=\"HEIGHT:", p, "%; TOP:", p * j, "%\"  class=\"month-row\">");
                htb.push("<table class=\"st-bg-table\" cellSpacing=\"0\" cellPadding=\"0\"><tbody><tr>");
                var dMax = B[j];

                for (var i = 0; i < 7; i++) {
                    var day = C[j * 7 + i];
                    htb.push("<td abbr='", day.Format("yyyy-M-d"), "' ch='qkadd' axis='00:00' title=''");

                    if (day.Format("yyyyMMdd") == new Date().Format("yyyyMMdd")) {
                        htb.push(" class=\"st-bg st-bg-today\">");
                    }
                    else {
                        htb.push(" class=\"st-bg\">");
                    }
                    htb.push("&nbsp;</td>");
                }
                //bgtable
                htb.push("</tr></tbody></table>");

                //log.diff("第" + j + "周的背景table构建耗时");
                //stgrid
                htb.push("<table class=\"st-grid\" cellpadding=\"0\" cellspacing=\"0\"><tbody>");

                //title tr
                htb.push("<tr>");
                var titletemp = "<td class=\"st-dtitle${titleClass}\" ch='qkadd' abbr='${abbr}' axis='00:00' title=\"${title}\"><span>${dayshow}</span></td>";

                for (var i = 0; i < 7; i++) {
                    var o = { titleClass: "", dayshow: "" };
                    var day = C[j * 7 + i];
                    if (day.Format("yyyyMMdd") == new Date().Format("yyyyMMdd")) {
                        o.titleClass = " st-dtitle-today";
                    }
                    if (day.getMonth() != showmonth) {
                        o.titleClass = " st-dtitle-nonmonth";
                    }
                    o.title = day.Format("yyyy年M月d日");
                    if (day.getDate() == 1) {
                        if (day.getMonth == 0) {
                            o.dayshow = day.Format("yyyy年M月d日");
                        }
                        else {
                            o.dayshow = day.Format("M月d日");
                        }
                    }
                    else {
                        o.dayshow = day.getDate();
                    }
                    o.abbr = day.Format("yyyy-M-d");
                    htb.push(Tp(titletemp, o));
                }
                htb.push("</tr>");
                var sfirstday = C[j * 7];

                BuildMonthRow(htb, formatevents[j], dMax, roweventcount, sfirstday);
                //htb=htb.concat(rowHtml); rowHtml = null;  

                htb.push("</tbody></table>");
                //month-row
                htb.push("</div>");
            }

            formatevents = B = C = hastdata = null;
            //return htb;
        }
        function BuildMonthRow(htr, events, dMax, sc, day) {
            var x = []; //一周中每一天都已经登记了多少个日程;
            var y = []; //一周中每一天总共有多少个日程;
            var z = []; //一周中每一天日程已经占用了多少行;
            var cday = [];  //当前行的每一天
            var l = events.length;
            var el = 0;
            //var c = tc();
            for (var j = 0; j < l; j++) {
                x.push(0);
                y.push(0);
                z.push(0);
                cday.push(DateAdd("d", j, day));
            }
            for (var j = 0; j < l; j++) {
                var ec = events[j] ? events[j].length : 0;
                y[j] += ec;
                for (var k = 0; k < ec; k++) {
                    var e = events[j][k];
                    if (e && e.colSpan > 1) {
                        for (var m = 1; m < e.colSpan; m++) {
                            y[j + m]++;
                        }
                    }
                }
            }
            //var htr=[];
            var tdtemp = "<td class='${cssclass}' axis='${axis}' ch='${ch}' abbr='${abbr}' title='${title}' ${otherAttr}>${html}</td>";
            for (var j = 0; j < sc && el < dMax; j++) {
                htr.push("<tr>");
                //var gridtr = $(__TRTEMP);
                for (var h = 0; h < l; ) {
                    var e = events[h] ? events[h][x[h]] : undefined;
                    var tempdata = { "class": "", axis: "", ch: "", title: "", abbr: "", html: "", otherAttr: "", click: "javascript:void(0);" };
                    var tempCss = ["st-c"];

                    if (e) { //如果存在
                        x[h] = x[h] + 1;
                        //如果当前是当天的最后一个日程
                        var bs = false;
                        if (z[h] + 1 == y[h] && e.colSpan == 1) {
                            bs = true;
                        }
                        if (!bs && j == (sc - 1) && z[h] < y[h]) {
                            el++;
                            $.extend(tempdata, { "axis": h, ch: "more", "abbr": cday[h].Format("yyyy/M/d"), html: "另外" + (y[h] - z[h]) + "个", click: "javascript:alert('more event');" });
                            tempCss.push("st-more st-moreul");
                            h++;
                        }
                        else {
                            tempdata.html = BuildMonthDayEvent(e, cday[h], l - h);
                            tempdata.ch = "show";
                            if (e.colSpan > 1) {
                                tempdata.otherAttr = " colSpan='" + e.colSpan + "'";
                                for (var m = 0; m < e.colSpan; m++) {
                                    z[h + m] = z[h + m] + 1;
                                }
                                h += e.colSpan;

                            }
                            else {
                                z[h] = z[h] + 1;
                                h++;
                            }
                            el++;
                        }
                    }
                    else {
                        if (j == (sc - 1) && z[h] < y[h] && y[h] > 0) {
                            $.extend(tempdata, { "axis": h, ch: "more", "abbr": cday[h].Format("yyyy/M/d"), html: "另外" + (y[h] - z[h]) + "个", click: "javascript:alert('more event');" });
                            tempCss.push("st-more st-moreul");
                            h++;
                        }
                        else {
                            $.extend(tempdata, { html: "&nbsp;", ch: "qkadd", "axis": "00:00", "abbr": cday[h].Format("yyyy-M-d"), title: "" });
                            tempCss.push("st-s");
                            h++;
                        }
                    }
                    tempdata.cssclass = tempCss.join(" ");
                    tempCss = null;
                    htr.push(Tp(tdtemp, tempdata));
                    tempdata = null;
                }
                htr.push("</tr>");
            }
            x = y = z = cday = null;
            //return htr;
        }
        function BuildMonthDayEvent(e, cday, length) {
            var theme;
            if (e.event[7] && e.event[7] >= 0) {
                theme = tc(e.event[7]);
            }
            else {
                theme = tc();
            }
            var p = { color: theme[2], title: "", extendClass: "", extendHTML: "", data: "" };
            var t = { crossevent: "", alldayevent: "", topic: "", startdate: "", enddate: "" };
            var title = "${crossevent}${alldayevent} ${topic}\r\n${startdate}-${enddate}";
            t.alldayevent = e.allday ? "[全天]" : "";
            t.crossevent = e.crossday ? "[跨天]" : "";
            t.topic = e.event[1];
            t.startdate = e.event[2].Format("yyyy年MM月dd日");
            t.enddate = e.event[3].Format("yyyy年MM月dd日");
            p.title = Tp(title, t);
            p.id = "bbit_cal_event_" + e.event[0];
			if(option.enableDrag && e.event[8]==1)
			{
				p.eclass ="drag";
			}
			else
			{
				p.eclass = "cal_" + e.event[0];
			}
            p.data = e.event.join("$");
            var sp = "<span style=\"cursor: pointer\">${content}</span>";
            var i = "<I class=\"cic cic-tmr\">&nbsp;</I>";
            var i2 = "<I class=\"cic cic-rcr\">&nbsp;</I>";
            var ml = "<div class=\"st-ad-ml\"></div>";
            var mr = "<div class=\"st-ad-mr\"></div>";
            var arrm = [];
            var sf = e.event[2] < cday;
            var ef = DateDiff("d", cday, e.event[3]) >= length;  //e.event[3] >= DateAdd("d", 1, cday);
            if (sf || ef) {
                if (sf) {
                    arrm.push(ml);
                    p.extendClass = "st-ad-mpad ";
                }
                if (ef)
                { arrm.push(mr); }
                p.extendHTML = arrm.join("");

            }
            var cen;
            if (!e.allday && !sf) {
                cen = pZero(e.st.hour) + ":" + pZero(e.st.minute) + " " + e.event[1];
            }
            else {
                cen = e.event[1];
            }
            var content = [];
            content.push(Tp(sp, { content: cen }));
            content.push(i);
            if (e.reevent)
            { content.push(i2); }
            p.content = content.join("");
            return Tp(__ALLDAYEVENTTEMP, p);
        }
        //格式化月日程格式化
        function formartEventsInHashtable(events, startday, daylength, rbdate, redate) {
            var hast = new Object();
            var l = events.length;
            for (var i = 0; i < l; i++) {
                var sD = events[i][2];
                var eD = events[i][3];
                var diff = DateDiff("d", sD, eD);
                var s = {};
                s.event = events[i];
                s.day = sD.getDate();
                s.year = sD.getFullYear();
                s.month = sD.getMonth() + 1;
                s.allday = events[i][4] == 1;
                s.crossday = events[i][5] == 1;
                s.reevent = events[i][6] == 1; //循环日程
                s.daystr = s.year + "/" + s.month + "/" + s.day;
                s.st = {};
                s.st.hour = sD.getHours();
                s.st.minute = sD.getMinutes();
                s.st.p = s.st.hour * 60 + s.st.minute; // 时间的开始位置
                s.et = {};
                s.et.hour = eD.getHours();
                s.et.minute = eD.getMinutes();
                s.et.p = s.et.hour * 60 + s.et.minute; // 时间的开始位置

                if (diff > 0) {
                    if (sD < rbdate) { //开始时间超出范围
                        sD = rbdate;
                    }
                    if (eD > redate) { //结束时间超出范围
                        eD = redate;
                    }
                    var f = startday - sD.getDay();
                    if (f > 0) { f -= daylength; }
                    var sdtemp = DateAdd("d", f, sD);
                    for (; sdtemp <= eD; sD = sdtemp = DateAdd("d", daylength, sdtemp)) {
                        var d = Clone(s);
                        var key = sD.Format("yyyyMMdd");
                        var x = DateDiff("d", sdtemp, eD);
                        if (hast[key] == null) {
                            hast[key] = [];
                        }
                        //处理表格跨界，分为跨周和不跨周
                        d.colSpan = (x >= daylength) ? daylength - DateDiff("d", sdtemp, sD) : DateDiff("d", sD, eD) + 1;
                        hast[key].push(d);
                        d = null;
                    }
                }
                else {
                    var key = events[i][2].Format("yyyyMMdd");
                    if (hast[key] == null) {
                        hast[key] = [];
                    }
                    s.colSpan = 1;
                    hast[key].push(s);
                }
                s = null;
            }
            return hast;
        }
        function gP(h, m) {
            return h * 42 + parseInt(m / 60 * 41);
        }
        function pZero(n) {
            return n < 10 ? "0" + n : "" + n;
        }
        //返回主题的颜色配置
        function tc(d) {
            function zc(c, i) {
                var d = "666666888888aaaaaabbbbbbdddddda32929cc3333d96666e69999f0c2c2b1365fdd4477e67399eea2bbf5c7d67a367a994499b373b3cca2cce1c7e15229a36633cc8c66d9b399e6d1c2f029527a336699668cb399b3ccc2d1e12952a33366cc668cd999b3e6c2d1f01b887a22aa9959bfb391d5ccbde6e128754e32926265ad8999c9b1c2dfd00d78131096184cb05288cb8cb8e0ba52880066aa008cbf40b3d580d1e6b388880eaaaa11bfbf4dd5d588e6e6b8ab8b00d6ae00e0c240ebd780f3e7b3be6d00ee8800f2a640f7c480fadcb3b1440edd5511e6804deeaa88f5ccb8865a5aa87070be9494d4b8b8e5d4d47057708c6d8ca992a9c6b6c6ddd3dd4e5d6c6274878997a5b1bac3d0d6db5a69867083a894a2beb8c1d4d4dae54a716c5c8d8785aaa5aec6c3cedddb6e6e41898951a7a77dc4c4a8dcdccb8d6f47b08b59c4a883d8c5ace7dcce";
                return "#" + d.substring(c * 30 + i * 6, c * 30 + (i + 1) * 6);
            }
            var c = d != null && d != undefined ? d : option.theme;
            return [zc(c, 0), zc(c, 1), zc(c, 2), zc(c, 3)];
        }
        function Tp(temp, dataarry) {
            return temp.replace(/\$\{([\w]+)\}/g, function(s1, s2) { var s = dataarry[s2]; if (typeof (s) != "undefined") { return s; } else { return s1; } });
        }
        function Ta(temp, dataarry) {
            return temp.replace(/\{([\d])\}/g, function(s1, s2) { var s = dataarry[s2]; if (typeof (s) != "undefined") { return encodeURIComponent(s); } else { return ""; } });
        }
        function fomartTimeShow(h) {
            return h < 10 ? "0" + h + ":00" : h + ":00";
        }
        //内置的快速添加日程
        function quickAddHandler(day, time, e) {
            if ((!option.quickAddHandler && option.quickAddUrl == "") || option.readonly) {
                return;
            }
            var isallday;
            if (time != "undefined" && time != "") {
                isallday = true;
            }
            else {
                //计算点击的位置;
                var m = $(this).offset().top;
                var t1 = (e.clientY - m) / 42;
                var t2 = parseInt(t1);
                var t3 = t1 - t2 > 0.5 ? "30" : "00";
                time = t2 + ":" + t3;
                isallday = false;
            }
            var tleft = e.clientX - 200;
            var ttop = e.clientY - 82;
            if (tleft <= 0) {
                tleft = 10;
            }
            if (ttop <= 0) {
                ttop = 10;
            }
            var maxLeft = document.documentElement.clientWidth;
            var maxTop = document.documentElement.clientHeight;
            if (tleft + 400 > maxLeft) {
                tleft = maxLeft - 418;
            }
            if (ttop + 165 > maxTop) {
                ttop = maxTop - 170;
            }
            var arrday = day.split('-');
            var art = time.split(':');
            var dateday = new Date(arrday[0], parseInt(arrday[1]) - 1, arrday[2], art[0], art[1]);
            var dateshow = dateday.Format("M月d日 周") + __CHNUM[dateday.getDay()];
            var timeshow = "";
            if (!isallday) {
                var sh = art[0];
                var sm = art[1];
                var eh = parseInt(sh) + 1;
                if (eh > 23) {

                    var nday = DateAdd("d", 1, dateday);
                    timeshow = ",&nbsp;" + time + "--" + nday.Format("M月d日 周") + __CHNUM[nday.getDay()] + ",&nbsp;00:" + sm;
                }
                else {
                    timeshow = ",&nbsp;" + time + "--" + eh + ":" + sm;
                }
            }
            var tempquickAddHanler = '<div id="bbit-cal-buddle" style="z-index: 180; width: 400px;visibility:hidden;" class="bubble"><table class="bubble-table" cellSpacing="0" cellPadding="0"><tbody><tr><td class="bubble-cell-side"><div id="tl1" class="bubble-corner"><div class="bubble-sprite bubble-tl"></div></div><td class="bubble-cell-main"><div class="bubble-top"></div><td class="bubble-cell-side"><div id="tr1" class="bubble-corner"><div class="bubble-sprite bubble-tr"></div></div>  <tr><td class="bubble-mid" colSpan="3"><div style="overflow: hidden" id="bubbleContent1"><div><div></div><div class="cb-root"><table class="cb-table" cellSpacing="0" cellPadding="0"><tbody><tr><th class="cb-key">时间：</th><td class=cb-value><div id="bbit-cal-buddle-timeshow"></div></td></tr><tr><th class="cb-key">内容：</th><td class="cb-value"><div class="textbox-fill-wrapper"><div class="textbox-fill-mid"><input id="bbit-cal-what" class="textbox-fill-input"/></div></div><div class="cb-example">例如：有个办公会议</div></td></tr></tbody></table><input id="bbit-cal-when" type="hidden"/><input id="bbit-cal-allday" type="hidden"/><input id="bbit-cal-quickAddBTN" value="创建活动" type="button"/>&nbsp; <SPAN id="bbit-cal-editLink" class="lk">修改活动详细信息 <StrONG>»</StrONG></SPAN></div></div></div><tr><td><div id="bl1" class="bubble-corner"><div class="bubble-sprite bubble-bl"></div></div><td><div class="bubble-bottom"></div><td><div id="br1" class="bubble-corner"><div class="bubble-sprite bubble-br"></div></div></tr></tbody></table><div id="bubbleClose1" class="bubble-closebutton"></div><div style="display: none" id="prong1" class="prong"><div class=bubble-sprite></div></div></div>';
            var biddle = $("#bbit-cal-buddle");
            if (biddle.length == 0) {
                $(document.body).append(tempquickAddHanler);
                biddle = $("#bbit-cal-buddle");
                var calbutton = $("#bbit-cal-quickAddBTN");
                var lbtn = $("#bbit-cal-editLink");
                var closebtn = $("#bubbleClose1").click(function() {
                    $("#bbit-cal-buddle").css("visibility", "hidden");
                });
                calbutton.click(function(e) {
                    if (option.isloading) {
                        return false;
                    }
                    option.isloading = true;
                    var what = $("#bbit-cal-what").val();
                    var when = $("#bbit-cal-when").val();
                    var allday = $("#bbit-cal-allday").val();
                    var f = /^[^\$\<\>]+$/.test(what);
                    if (!f) {
                        alert("日程标题不能为空且不能包含符号($<>)");
                        $("#bbit-cal-what").focus();
						option.isloading= false;
                        return false;
                    }
                    var param = [{ "name": "CalendarTitle", value: what }, { "name": "CalendarStartTime", value: when }, { "name": "IsAllDayEvent", value: allday}];
                    if (option.quickAddHandler && $.isFunction(option.quickAddHandler)) {
                        option.quickAddHandler.call(this, param);
                        $("#bbit-cal-buddle").css("visibility", "hidden");
                    }
                    else {
                        $("#bbit-cal-buddle").css("visibility", "hidden");
                        var newdata = [];
                        var tId = -1;
                        option.onBeforeRequestData && option.onBeforeRequestData(2);
                        $.post(option.quickAddUrl, param, function(data) {
                            if (data) {
                                if (data.IsSuccess == true) {
                                    option.isloading = false;
                                    option.eventItems[tId][0] = data.Data;
                                    option.eventItems[tId][8] = 1;
                                    rerender();
                                    option.onAfterRequestData && option.onAfterRequestData(2);
                                }
                                else {
                                    option.onRequestDataError && option.onRequestDataError(2, data);
                                    option.isloading = false;
                                    option.onAfterRequestData && option.onAfterRequestData(2);
                                }
                            }

                        }, "json");

                        newdata.push(-1, what);
                        var arr = when.split(" ");
                        var arr2 = arr[0].split("-");
                        var arr3 = arr[1].split(":");
                        var m = arr2[1].indexOf("0") == 0 ? arr2[1].substr(1, 1) : arr2[1];
                        var d = arr2[2].indexOf("0") == 0 ? arr2[2].substr(1, 1) : arr2[2];
                        var h = arr3[0].indexOf("0") == 0 ? arr3[0].substr(1, 1) : arr3[0];
                        var n = arr3[1].indexOf("0") == 0 ? arr3[1].substr(1, 1) : arr3[1];
                        var sd = new Date(arr2[0], parseInt(m) - 1, d, h, n);
                        if (allday == "1") {
                            newdata.push(sd, sd, 1, 0, 0);
                        }
                        else {
                            newdata.push(sd, DateAdd("h", 1, sd), 0, h == 23 && n == 30, 0);
                        }
                        newdata.push(-1, 0, "", ""); //主题,权限,参与人，
                        tId = Ind(newdata);
                        rerender();
                    }
                });
                lbtn.click(function(e) {
                    if (!option.EditCmdhandler) {
                        alert("参数EditCmdhandler没有配置");
                    }
                    else {
                        $("#bbit-cal-buddle").css("visibility", "hidden");
                        if (option.EditCmdhandler && $.isFunction(option.EditCmdhandler)) {
                            option.EditCmdhandler.call(this, ['0', '', $("#bbit-cal-when").val(), , $("#bbit-cal-allday").val()]);
                        }
                    }
                    return false;
                });
                biddle.click(function(e) { return false });
            }
            var ts = $("#bbit-cal-buddle-timeshow").html(dateshow + timeshow);
            var calwhat = $("#bbit-cal-what").val("");
            $("#bbit-cal-allday").val(isallday ? "1" : "0");
            var calwhen = $("#bbit-cal-when").val(dateday.Format("yyyy-MM-dd HH:mm"));
            biddle.css({ "visibility": "visible", left: tleft, top: ttop });
            calwhat.focus();
            $(document).one("click", function() {
                $("#bbit-cal-buddle").css("visibility", "hidden");
            });
        }
        function ResizeView() {
            var _MH = document.documentElement.clientHeight;
            var _viewType = option.view;
            if (_viewType == "day" || _viewType == "week") {
                var $dvwkcontaienr = $("#dvwkcontaienr");
                var $dvtec = $("#dvtec");
                if ($dvwkcontaienr.length == 0 || $dvtec.length == 0) {
                    alert("视图未准备就绪"); return;
                }
                var dvwkH = $dvwkcontaienr.height() + 2;
                var calH = option.height - 8 - dvwkH;
                $dvtec.height(calH);
                if (typeof (option.scoll) == "undefined") {
                    //设置滚动条的位置
                    var currentday = new Date();
                    var h = currentday.getHours();
                    var m = currentday.getMinutes();
                    var th = gP(h, m);
                    var ch = $dvtec.attr("clientHeight");
                    var sh = th - 0.5 * ch;
                    var ph = $dvtec.attr("scrollHeight");
                    if (sh < 0) sh = 0;
                    if (sh > ph - ch) sh = ph - ch - 10 * (23 - h);
                    $dvtec.attr("scrollTop", sh);
                }
                else {
                    $dvtec.attr("scrollTop", option.scoll);
                }
            }
            else if (_viewType == "month") {
				$("#gridcontainer").width();

                //Resize GridContainer
            }

        }
        function CalDateShow(startday, enddate) {
            if (!enddate) {
                return startday.Format("yyyy年M月d日");
            }
            else {
                if (startday.getFullYear() != enddate.getFullYear()) {
                    return startday.Format("yyyy年M月d日") + "-" + enddate.Format("yyyy年M月d日");
                }
                else if (startday.getMonth() != enddate.getMonth()) {
                    return startday.Format("yyyy年M月d日") + "-" + enddate.Format("M月d日");
                }
                else {
                    return startday.Format("yyyy年M月d日") + "-" + enddate.Format("d日");
                }
            }
        }
        function closeCc() {
            $("#cal-month-cc").css("visibility", "hidden");
        }
        function mvmoreshow(mv) {			
            var me = $(this);
            var divIndex = mv.id.split('_')[1];
            var pdiv = $(mv);
            var offsetMe = me.position();
            var offsetP = pdiv.position();
            var width = (me.width() + 2) * 1.5;
            var top = offsetP.top + 15;
            var left = offsetMe.left;
            var maxleft = document.documentElement.clientWidth;
            if (left + width >= maxleft) {
                left = offsetMe.left - (me.width() + 2) * 0.5;
            }

            var newOff = { left: left, top: top, "z-index": 180, width: width, "visibility": "visible" };
            var daystr = this.abbr;
            var arrdays = daystr.split('/');
            var day = new Date(arrdays[0], parseInt(arrdays[1] - 1), arrdays[2]);
            var cc = $("#cal-month-cc");
            var ccontent = $("#cal-month-cc-content table tbody");
            var ctitle = $("#cal-month-cc-title");
            ctitle.html(day.Format("MM月dd日") + " 星期" + __CHNUM[day.getDay()]);
            ccontent.empty();
            //var c = tc()[2];
            var edata = $("#gridEvent").data("mvdata");
            var events = edata[divIndex];
            var index = parseInt(this.axis);
			var htm=[];
            for (var i = 0; i <= index; i++) {
                var ec = events[i] ? events[i].length : 0;
                for (var j = 0; j < ec; j++) {
                    var e = events[i][j];
                    if (e) {
                        if ((e.colSpan + i - 1) >= index) {
							htm.push("<tr><td class='st-c'>");                           
							htm.push(BuildMonthDayEvent(e, day, 1));                          
							htm.push("</td></tr>");
                        }
                    }
                }
            }
			ccontent.html(htm.join(""));
			//click
			ccontent.find("div.rb-o").each(function(i){
			  $(this).click(dayshow);
			});

            edata = events = null;
            cc.css(newOff);
            $(document).one("click", closeCc);
			return false;
        }
        function GetChipDv(elm) {
            if (elm.tagName.toUpperCase() == "BODY") {
                return null;
            }
            if (elm.tagName.toUpperCase() == "DIV" && elm.className == "chip") {
                return elm;
            }
            else if (elm.className == "tg-col-eventwrapper") {
                return null;
            }
            else {
                var p = $(elm).parent();
                if (p.length > 0) {
                    if (p[0].tagName.toUpperCase() != "DIV" || p[0].className != "chip") {
                        return GetChipDv(p[0]);
                    }
                    else {
                        return p[0];
                    }
                }
            }
            return null;
        }
        function GetTH(elm) {
            if (elm.tagName.toUpperCase() == "TH") {
                return elm;
            }
            else if (elm.tagName.toUpperCase() == "BODY") {
                return null;
            }
            else {
                var p = $(elm).parent();
                if (p.length > 0) {
                    if (p[0].tagName.toUpperCase() != "TH") {
                        return GetTH(p[0]);
                    }

                    else {
                        return p[0];
                    }
                }
            }
            return null;
        }
        function GetTD(elm) {
            if (elm.tagName.toUpperCase() == "TD") {
                return elm;
            }
            else if (elm.tagName.toUpperCase() == "BODY") {
                return null;
            }
            else {
                var p = $(elm).parent();
                if (p.length > 0) {
                    if (p[0].tagName.toUpperCase() != "TD") {
                        return GetTD(p[0]);
                    }
                    else {
                        return p[0];
                    }
                }
            }
            return null;
        }
        function parseED(data) {
            if (data.length > 6) {
                var e = [];
                e.push(data[0], data[1], new Date(data[2]), new Date(data[3]), parseInt(data[4]), parseInt(data[5]), parseInt(data[6]), data[7] != undefined ? parseInt(data[7]) : -1, data[8] != undefined ? parseInt(data[8]) : 0, data[9], data[10]);
                return e;
            }
            return null;

        }
        //type =0 单个事件，type=1删除序列
        function quickd(type) {
            $("#bbit-cs-buddle").css("visibility", "hidden");
            var calid = $("#bbit-cs-id").val();
            var param = [{ "name": "calendarId", value: calid },
                        { "name": "type", value: type}];
            var de = rebyKey(calid,true);
            option.onBeforeRequestData && option.onBeforeRequestData(3);
            $.post(option.quickDeleteUrl, param, function(data) {
                if (data) {
                    if (data.IsSuccess) {
                        de = null;
                        option.onAfterRequestData && option.onAfterRequestData(3);
                    }
                    else {
                        option.onRequestDataError && option.onRequestDataError(3, data);
                        Ind(de);
                        rerender();
                        option.onAfterRequestData && option.onAfterRequestData(3);
                    }
                }
            }, "json");
            rerender();
        }
		function dayupdate(e,sm,em)
		{			
			var dvdata = $("div.dhdV", this);
			if (dvdata.length > 0) {
                var data = parseED(dvdata.text().split("$"));
                if (data != null) {                  
					if (option.quickUpdateUrl != "" && data[8] == 1 && option.readonly != true) {
					   var id= data[0];					  
					   var os = data[2];
					   var od = data[3];
					   var start = DateAdd("n",sm,data[2]);
					   var end = DateAdd("n",em,data[3]);
					   var param = [{ "name": "calendarId", value: id },
									{ "name": "CalendarStartTime", value: start.Format("yyyy-MM-dd HH:mm:ss")},
									{ "name": "CalendarEndTime", value: end.Format("yyyy-MM-dd HH:mm:ss")}
						           ];
					   var d;
					   if (option.quickUpdateHandler && $.isFunction(option.quickUpdateHandler)) {
							 option.quickUpdateHandler.call(this, param);                       
						}
						else {
							option.onBeforeRequestData && option.onBeforeRequestData(4);
							$.post(option.quickUpdateUrl, param, function(data) {
								if (data) {
									if (data.IsSuccess == true) {										
										option.isloading = false;								
										option.onAfterRequestData && option.onAfterRequestData(4);
									}
									else {
										option.onRequestDataError && option.onRequestDataError(4, data);
										option.isloading = false;
										//还原数据，重画										
										d=rebyKey(id,true);
										d[2] = os;
										d[3] = od;
										Ind(d);
										rerender();
										d=null;
										
										option.onAfterRequestData && option.onAfterRequestData(4);
									}
								}

							}, "json");	
							//更新数据重画						
							d=rebyKey(id,true);
							if(d)
							{
								d[2]= start;
								d[3]= end;
							}
							Ind(d);
							rerender();
						}


					}
				}
			}
		}
        function dayshow(event) {			
			var parent= this;            
            var dvdata = $("div.dhdV", parent);
            if (dvdata.length > 0) {
                var data = parseED(dvdata.text().split("$"));
                if (data != null) {                  
                    if (option.quickDeleteUrl != "" && data[8] == 1 && option.readonly != true) {
                        var csbuddle = '<div id="bbit-cs-buddle" style="z-index: 180; width: 400px;visibility:hidden;" class="bubble"><table class="bubble-table" cellSpacing="0" cellPadding="0"><tbody><tr><td class="bubble-cell-side"><div id="tl1" class="bubble-corner"><div class="bubble-sprite bubble-tl"></div></div><td class="bubble-cell-main"><div class="bubble-top"></div><td class="bubble-cell-side"><div id="tr1" class="bubble-corner"><div class="bubble-sprite bubble-tr"></div></div>  <tr><td class="bubble-mid" colSpan="3"><div style="overflow: hidden" id="bubbleContent1"><div><div></div><div class="cb-root"><table class="cb-table" cellSpacing="0" cellPadding="0"><tbody><tr><td class="cb-value"><div class="textbox-fill-wrapper"><div class="textbox-fill-mid"><div id="bbit-cs-what" title="点击查看详细" class="textbox-fill-div lk" style="cursor:pointer;"></div></div></div></td></tr><tr><td class=cb-value><div id="bbit-cs-buddle-timeshow"></div></td></tr></tbody></table><div class="bbit-cs-split"><input id="bbit-cs-id" type="hidden" value=""/>[ <span id="bbit-cs-delete" class="lk">删除</span> ]&nbsp; <SPAN id="bbit-cs-editLink" class="lk">修改活动详细信息 <StrONG>»</StrONG></SPAN></div></div></div></div><tr><td><div id="bl1" class="bubble-corner"><div class="bubble-sprite bubble-bl"></div></div><td><div class="bubble-bottom"></div><td><div id="br1" class="bubble-corner"><div class="bubble-sprite bubble-br"></div></div></tr></tbody></table><div id="bubbleClose2" class="bubble-closebutton"></div><div id="prong1" class="prong"><div class=bubble-sprite></div></div></div>';
                        var bud = $("#bbit-cs-buddle");
                        if (bud.length == 0) {
                            bud = $(csbuddle).appendTo(document.body);
                            var calbutton = $("#bbit-cs-delete");
                            var lbtn = $("#bbit-cs-editLink");
                            var closebtn = $("#bubbleClose2").click(function() {
                                $("#bbit-cs-buddle").css("visibility", "hidden");
                            });
                            calbutton.click(function() {
                                var data = $("#bbit-cs-buddle").data("cdata");
                                if (option.DeleteCmdhandler && $.isFunction(option.DeleteCmdhandler)) {
                                    option.DeleteCmdhandler.call(this, data, quickd);
                                }
                                else {
                                    if (confirm("确定删除该日程吗？")) {
                                        var s = 0; //0 单个事件 1，序列
                                        if (data[6] == 1) {
                                            if (confirm("删除此序列还是单个事件？\r\n点击[确定]删除事件,点击[取消]删除序列")) {
                                                s = 0;
                                            }
                                            else {
                                                s = 1;
                                            }
                                        }
                                        else {
                                            s = 0;
                                        }
                                        quickd(s);
                                    }
                                }
                            });
                            $("#bbit-cs-what").click(function(e) {
                                if (!option.ViewCmdhandler) {
                                    alert("参数ViewCmdhandler没有配置");
                                }
                                else {
                                    if (option.ViewCmdhandler && $.isFunction(option.ViewCmdhandler)) {
                                        option.ViewCmdhandler.call(this, $("#bbit-cs-buddle").data("cdata"));
                                    }
                                }
                                $("#bbit-cs-buddle").css("visibility", "hidden");
                                return false;
                            });
                            lbtn.click(function(e) {
                                if (!option.EditCmdhandler) {
                                    alert("参数EditCmdhandler没有配置");
                                }
                                else {
                                    if (option.EditCmdhandler && $.isFunction(option.EditCmdhandler)) {
                                        option.EditCmdhandler.call(this, $("#bbit-cs-buddle").data("cdata"));
                                    }
                                }
                                $("#bbit-cs-buddle").css("visibility", "hidden");
                                return false;
                            });
                            bud.click(function() { return false });
                        }
						
                        var tleft = event.clientX - 110;
                        var ttop = event.clientY - 217;
						var ishide=false;
                        if (tleft <= 0) {
                            tleft = 10;
							ishide=true;
                        }
                        if (ttop <= 0) {
                            ttop = 10;
							ishide=true;
                        }
                        var maxLeft = document.documentElement.clientWidth;
                        var maxTop = document.documentElement.clientHeight;
                        if (tleft + 280 > maxLeft) {
                            tleft = maxLeft - 418;
							ishide=true;
                        }
                        if (ttop + 217 <4) {
                            ttop = 10;
							ishide=true;
                        }
						if(ishide)
						{	
							$("#prong1").hide()
						}
						else
						{
							$("#prong1").show()
						}
                        var ss = [];
                        var iscos = DateDiff("d", data[2], data[3]) != 0;
                        ss.push(data[2].Format("M 月d 日"), " (周", __CHNUM[data[2].getDay()], ")");
                        if (data[4] != 1) {
                            ss.push(",", data[2].Format("HH:mm"));
                        }

                        if (iscos) {
                            ss.push("-", data[3].Format("M 月d 日"), " (周", __CHNUM[data[3].getDay()], ")");
                            if (data[4] != 1) {
                                ss.push(",", data[3].Format("HH:mm"));
                            }
                        }
                        var ts = $("#bbit-cs-buddle-timeshow").html(ss.join(""));
                        $("#bbit-cs-what").html(data[1]);
                        $("#bbit-cs-id").val(data[0]);
                        bud.data("cdata", data);
                        bud.css({ "visibility": "visible", left: tleft, top: ttop });

                        $(document).one("click", function() {
                            $("#bbit-cs-buddle").css("visibility", "hidden");
                        });
                    }
                    else {
                        if (!option.ViewCmdhandler) {
                            alert("参数ViewCmdhandler没有配置");
                        }
                        else {
                            if (option.ViewCmdhandler && $.isFunction(option.ViewCmdhandler)) {
                                option.ViewCmdhandler.call(this, data);
                            }
                        }
                    }

                }
                else {
                    alert("数据格式错误!");
                }
				return false;
            }
        }
		function RowHandler(e) {
            $(document).click();
            var t = e.srcElement || e.target;          
			var td = GetTD(t);
			if (td == null) {
				return;
			}
			var ch = $.browser.msie ? td.ch : td.getAttribute("ch");
			if (ch == "qkadd") {
				quickAddHandler.call(td, td.abbr, td.axis, e);
			}	
			else if (ch == "more") {
                mvmoreshow.call(td, this);
            }
			else if (ch == "show") {				
				dayshow.call(td, e);
			}           
			return false;
        }
        function WeekToDay(e) {        
            var th = this;
            if (th) {
                var day = th.abbr.split(/[\-\\\/]/);
                var showday = new Date(day[0], parseInt(day[1]) - 1, day[2]);
                option.showday = showday;
                option.view = "day";
                var nc = { view: option.view, weekstartday: option.weekstartday, theme: option.theme };
                render("day", option.showday, option.eventItems, nc);
                nc = null;
                if (option.onWeekToDay) {
                    option.onWeekToDay(option);
                }
                return false;
            }
        }
    
        var c = {
            sv: function(view) { //视图切换                
                if (view == option.view) {
                    return;
                }
                clearcontainer();
                option.view = view;
                var nc = { view: view, weekstartday: option.weekstartday, theme: option.theme };
                render(option.view, option.showday, option.eventItems, nc);
                nc = null;
                dochange();
            },
            rf: function() {
                populate();
            },
            gt: function(d) {
                if (!d) {
                    d = new Date();
                }
                option.showday = d;
                var nc = { view: option.view, weekstartday: option.weekstartday, theme: option.theme };
                render(option.view, option.showday, option.eventItems, nc);
                nc = null;
                dochange();
            },

            pv: function() {
                switch (option.view) {
                    case "day":
                        option.showday = DateAdd("d", -1, option.showday);
                        break;
                    case "week":
                        option.showday = DateAdd("w", -1, option.showday);
                        break;
                    case "month":
                        option.showday = DateAdd("m", -1, option.showday);
                        break;
                }
                var nc = { view: option.view, weekstartday: option.weekstartday, theme: option.theme };
                render(option.view, option.showday, option.eventItems, nc);
                nc = null;
                dochange();
            },
            nt: function() {
                switch (option.view) {
                    case "day":
                        option.showday = DateAdd("d", 1, option.showday);
                        break;
                    case "week":
                        option.showday = DateAdd("w", 1, option.showday);
                        break;
                    case "month":
                        option.showday = DateAdd("m", 1, option.showday);
                        break;
                }
                var nc = { view: option.view, weekstartday: option.weekstartday, theme: option.theme };
                render(option.view, option.showday, option.eventItems, nc);
                nc = null;
                dochange();
            },
            go: function() {
                return option;
            },
            so: function(p) {
                option = $.extend(option, p);
            }
        };
        this[0].bcal = c;
        return this;
    };
    $.fn.BCalSwtichview = function(view) {
        return this.each(function() {
            if (this.bcal) {
                this.bcal.sv(view);
            }
        })
    };
    $.fn.BCalReload = function() {
        return this.each(function() {
            if (this.bcal) {
                this.bcal.rf();
            }
        })
    };
    $.fn.BCalGoToday = function(d) {
        return this.each(function() {
            if (this.bcal) {
                this.bcal.gt(d);
            }
        })
    };
    $.fn.BCalPrev = function() {
        return this.each(function() {
            if (this.bcal) {
                this.bcal.pv();
            }
        })
    };
    $.fn.BCalNext = function() {
        return this.each(function() {
            if (this.bcal) {
                this.bcal.nt();
            }
        })
    };
    $.fn.BcalGetOp = function() {
        if (this[0].bcal) {
            return this[0].bcal.go();
        }
        return null;
    };
    $.fn.BcalSetOp = function(p) { //function to update general options
        if (this[0].bcal) {
            return this[0].bcal.so(p);
        }
    }; //end flexOptions
})(jQuery);