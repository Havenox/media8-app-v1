using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Media8.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSnapshotsToAssignments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SnapshotPackageName",
                table: "PackageAssignments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "SnapshotPrice",
                table: "PackageAssignments",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SnapshotValidityDays",
                table: "PackageAssignments",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SnapshotVideoQuantity",
                table: "PackageAssignments",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SnapshotPackageName",
                table: "PackageAssignments");

            migrationBuilder.DropColumn(
                name: "SnapshotPrice",
                table: "PackageAssignments");

            migrationBuilder.DropColumn(
                name: "SnapshotValidityDays",
                table: "PackageAssignments");

            migrationBuilder.DropColumn(
                name: "SnapshotVideoQuantity",
                table: "PackageAssignments");
        }
    }
}
