using Perry.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Perry.Infrastructure.Persistence.Configurations;

public class AuthTokenConfiguration : IEntityTypeConfiguration<AuthToken>
{
    public void Configure(EntityTypeBuilder<AuthToken> builder)
    {
        builder.ToTable("AuthTokens");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Purpose).HasMaxLength(32).IsRequired();
        builder.Property(x => x.LookupKey).HasMaxLength(256).IsRequired();
        builder.Property(x => x.Secret).HasMaxLength(128).IsRequired();

        builder.HasIndex(x => new { x.Purpose, x.LookupKey });
        builder.HasIndex(x => x.ExpiresAtUtc);
        builder.HasIndex(x => x.UsedAtUtc);
    }
}
