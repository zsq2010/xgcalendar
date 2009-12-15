using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace AzureCalendarMvcWeb.Helps
{
    public class TimeHelper
    {

        /// <summary>
        /// Millis the time stamp.
        /// </summary>
        /// <param name="theDate">The date.</param>
        /// <returns></returns>
        public static long MilliTimeStamp(DateTime theDate)
        {
            DateTime d1 = new DateTime(1970, 1, 1);
            DateTime d2 = theDate.ToUniversalTime();
            TimeSpan ts = new TimeSpan(d2.Ticks - d1.Ticks);
            return (long)ts.TotalMilliseconds;
        }
        /// <summary>
        /// Gets the time zone.
        /// </summary>
        /// <returns></returns>
        public static int GetTimeZone()
        {
            DateTime now = DateTime.Now;
            var utcnow = now.ToUniversalTime();

            var sp = now - utcnow;

            return sp.Hours;
        }
    }
}
