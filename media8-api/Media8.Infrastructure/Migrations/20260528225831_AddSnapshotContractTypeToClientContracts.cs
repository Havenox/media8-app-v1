using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Media8.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSnapshotContractTypeToClientContracts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SnapshotContractType",
                table: "ClientContracts",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            // Backfill: Copy ContractType from Offers to existing ClientContracts
            migrationBuilder.Sql("UPDATE \"ClientContracts\" cc SET \"SnapshotContractType\" = o.\"ContractType\" FROM \"Offers\" o WHERE cc.\"OfferId\" = o.\"Id\";");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SnapshotContractType",
                table: "ClientContracts");
        }
    }
}
