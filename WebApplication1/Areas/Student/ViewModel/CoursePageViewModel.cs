using WebApplication1.Models;

namespace WebApplication1.Areas.Student.ViewModels
{
    public class CoursePageViewModel
    {
        public KhoaHoc Course { get; set; }
        public List<KhoaHoc> RelatedCourses { get; set; }
        public List<string> Includes { get; set; }
        public List<string> Skills { get; set; }
        public Dictionary<string, int> VideoDurations { get; set; } // Thời lượng video (phút)
    }
}