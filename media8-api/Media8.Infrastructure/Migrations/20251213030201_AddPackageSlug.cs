using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Media8.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPackageSlug : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Truncate/Delete Packages to allow unique index creation (Seeder will restore them)
            migrationBuilder.Sql("DELETE FROM \"Packages\";");
            migrationBuilder.Sql("DELETE FROM \"PackageAssignments\";"); // Dependents might need clearing too if cascade isn't set
            
            migrationBuilder.AddColumn<string>(
                name: "Slug",
                table: "Packages",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Packages_Slug",
                table: "Packages",
                column: "Slug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Packages_Slug",
                table: "Packages");

            migrationBuilder.DropColumn(
                name: "Slug",
                table: "Packages");
        }
    }
}
