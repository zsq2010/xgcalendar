using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace AzureCalendarMvcWeb.Models
{
    public class CalendarRepository:ICalendarRepository
    {

        readonly AzureCalendarDb _dbcontext = new AzureCalendarDb();
        #region ICalendarRepository 成员

        public int UpdateCalendar(Calendar data)
        {          
           return _dbcontext.SaveChanges();
        }

        public int AddCalendar(Calendar data)
        {     
          _dbcontext.AddObject("Calendars",data);
          int t= _dbcontext.SaveChanges();
            if(t>0)
            {
                return data.Id;
            }
            else
            {
                return -1;
            }

        }

        public List<Calendar> QueryCalendars(DateTime st, DateTime ed, string useId)
        {
            var list =from n in _dbcontext.Calendars                   
                      where n.UPAccount==useId &&  ((n.StartTime > st && n.StartTime < ed)  || (n.EndTime > st && n.EndTime < ed))
                      orderby n.StartTime   
                      select  n ;
            return list.ToList();
        }

        public Calendar GetCalendar(int Id)
        {           
            return _dbcontext.Calendars.Where(x =>x.Id == Id).First();
        }

        public int DeleteCalendar(int Id,string uId)
        {
            Calendar c = GetCalendar(Id);
            if (c.UPAccount != uId)
            {
                throw new Exception("没有权限");
            }
            else
            {
                _dbcontext.DeleteObject(c);
                return _dbcontext.SaveChanges();
            }
        }

        #endregion
    }
}
