using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Mvc.Ajax;

namespace AzureCalendarMvcWeb.Controllers
{
    public class BaseController : Controller
    {

        public string UserId
        {
            get
            {
                return base.Request.UserHostAddress;  
            }
        }

    }
}
