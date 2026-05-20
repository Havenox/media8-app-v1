using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Media8.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveLegacyPackagesAndAssignments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ServiceBalanceLots_ClientContracts_ClientContractId",
                table: "ServiceBalanceLots");

            migrationBuilder.DropForeignKey(
                name: "FK_ServiceBalanceLots_PackageAssignments_AssignmentId",
                table: "ServiceBalanceLots");

            migrationBuilder.DropTable(
                name: "PackageAssignments");

            migrationBuilder.DropTable(
                name: "PackageVideoFormats");

            migrationBuilder.DropTable(
                name: "Packages");

            migrationBuilder.DropIndex(
                name: "IX_ServiceBalanceLots_ClientContractId",
                table: "ServiceBalanceLots");

            migrationBuilder.DropColumn(
                name: "ClientContractId",
                table: "ServiceBalanceLots");

            migrationBuilder.AddForeignKey(
                name: "FK_ServiceBalanceLots_ClientContracts_AssignmentId",
                table: "ServiceBalanceLots",
                column: "AssignmentId",
                principalTable: "ClientContracts",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ServiceBalanceLots_ClientContracts_AssignmentId",
                table: "ServiceBalanceLots");

            migrationBuilder.AddColumn<Guid>(
                name: "ClientContractId",
                table: "ServiceBalanceLots",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Packages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Badge = table.Column<string>(type: "text", nullable: true),
                    Category = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DeliveryDays = table.Column<int>(type: "integer", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Disclaimer = table.Column<string>(type: "text", nullable: true),
                    Features = table.Column<List<string>>(type: "text[]", nullable: false),
                    IsPublic = table.Column<bool>(type: "boolean", nullable: false),
                    LoyaltyMonths = table.Column<int>(type: "integer", nullable: false),
                    MaxDurationSeconds = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Price = table.Column<decimal>(type: "numeric", nullable: false),
                    Slug = table.Column<string>(type: "text", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ValidityDays = table.Column<int>(type: "integer", nullable: true),
                    VideoQuantity = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Packages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PackageAssignments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AssignedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    ClientId = table.Column<Guid>(type: "uuid", nullable: false),
                    PackageId = table.Column<Guid>(type: "uuid", nullable: false),
                    ActivatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AssignedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SnapshotPackageName = table.Column<string>(type: "text", nullable: true),
                    SnapshotPrice = table.Column<decimal>(type: "numeric", nullable: true),
                    SnapshotValidityDays = table.Column<int>(type: "integer", nullable: true),
                    SnapshotVideoQuantity = table.Column<int>(type: "integer", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PackageAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PackageAssignments_Packages_PackageId",
                        column: x => x.PackageId,
                        principalTable: "Packages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PackageAssignments_Users_AssignedBy",
                        column: x => x.AssignedBy,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PackageAssignments_Users_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PackageVideoFormats",
                columns: table => new
                {
                    PackagesId = table.Column<Guid>(type: "uuid", nullable: false),
                    SupportedFormatsId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PackageVideoFormats", x => new { x.PackagesId, x.SupportedFormatsId });
                    table.ForeignKey(
                        name: "FK_PackageVideoFormats_Packages_PackagesId",
                        column: x => x.PackagesId,
                        principalTable: "Packages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PackageVideoFormats_VideoFormats_SupportedFormatsId",
                        column: x => x.SupportedFormatsId,
                        principalTable: "VideoFormats",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ServiceBalanceLots_ClientContractId",
                table: "ServiceBalanceLots",
                column: "ClientContractId");

            migrationBuilder.CreateIndex(
                name: "IX_PackageAssignments_AssignedBy",
                table: "PackageAssignments",
                column: "AssignedBy");

            migrationBuilder.CreateIndex(
                name: "IX_PackageAssignments_ClientId",
                table: "PackageAssignments",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_PackageAssignments_PackageId",
                table: "PackageAssignments",
                column: "PackageId");

            migrationBuilder.CreateIndex(
                name: "IX_Packages_Slug",
                table: "Packages",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PackageVideoFormats_SupportedFormatsId",
                table: "PackageVideoFormats",
                column: "SupportedFormatsId");

            migrationBuilder.AddForeignKey(
                name: "FK_ServiceBalanceLots_ClientContracts_ClientContractId",
                table: "ServiceBalanceLots",
                column: "ClientContractId",
                principalTable: "ClientContracts",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ServiceBalanceLots_PackageAssignments_AssignmentId",
                table: "ServiceBalanceLots",
                column: "AssignmentId",
                principalTable: "PackageAssignments",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
