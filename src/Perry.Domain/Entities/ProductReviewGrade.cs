using System.ComponentModel.DataAnnotations;

namespace Perry.Domain.Entities;

public record ProductReviewGrade
{
    [Key]
    public Guid Id { get; set; }
    [Required]
    public Guid UserId { get; set; }
    [Required]
    public Guid ReviewId { get; set; }

    public ProductReview Review { get; set; } = null!;
    
    public bool IsHelpful { get; set; }
    public bool Reported { get; set; }
    
};