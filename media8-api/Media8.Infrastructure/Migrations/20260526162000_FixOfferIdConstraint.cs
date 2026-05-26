using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Media8.Infrastructure.Migrations
{
    public partial class FixOfferIdConstraint : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop constraint if exists - safe for production
            migrationBuilder.Sql(@"
                DO $$ BEGIN
                    ALTER TABLE ""VideoFormats"" DROP CONSTRAINT IF EXISTS ""FK_VideoFormats_Offers_OfferId"";
                EXCEPTION
                    WHEN undefined_table THEN NULL;
                END $$;
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // No-op - we don't want to recreate this FK
        }
    }
}
