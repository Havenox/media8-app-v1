using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Media8.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialSchemaPascalCase : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:app_role", "client,editor,admin")
                .Annotation("Npgsql:Enum:assignment_status", "active,expired,cancelled")
                .Annotation("Npgsql:Enum:contract_type", "avulso,pacote,assinatura")
                .Annotation("Npgsql:Enum:lot_source", "purchase,subscription,promo,gift")
                .Annotation("Npgsql:Enum:notification_type", "info,success,warning,order")
                .Annotation("Npgsql:Enum:order_status", "pending,in_progress,in_review,changes_requested,approved")
                .Annotation("Npgsql:Enum:package_category", "assinatura,pacote,avulso")
                .Annotation("Npgsql:Enum:timeline_action_type", "status_change,comment,version_upload");

            migrationBuilder.CreateTable(
                name: "EditingStyles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EditingStyles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Packages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Slug = table.Column<string>(type: "text", nullable: false),
                    Category = table.Column<int>(type: "integer", nullable: false),
                    Price = table.Column<decimal>(type: "numeric", nullable: false),
                    VideoQuantity = table.Column<int>(type: "integer", nullable: false),
                    MaxDurationSeconds = table.Column<int>(type: "integer", nullable: false),
                    ValidityDays = table.Column<int>(type: "integer", nullable: true),
                    LoyaltyMonths = table.Column<int>(type: "integer", nullable: false),
                    DeliveryDays = table.Column<int>(type: "integer", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Features = table.Column<List<string>>(type: "text[]", nullable: false),
                    Disclaimer = table.Column<string>(type: "text", nullable: true),
                    Badge = table.Column<string>(type: "text", nullable: true),
                    IsPublic = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Packages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Message = table.Column<string>(type: "text", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Read = table.Column<bool>(type: "boolean", nullable: false),
                    Link = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Notifications_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PackageAssignments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PackageId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClientId = table.Column<Guid>(type: "uuid", nullable: false),
                    AssignedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    AssignedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ActivatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SnapshotPackageName = table.Column<string>(type: "text", nullable: true),
                    SnapshotVideoQuantity = table.Column<int>(type: "integer", nullable: true),
                    SnapshotPrice = table.Column<decimal>(type: "numeric", nullable: true),
                    SnapshotValidityDays = table.Column<int>(type: "integer", nullable: true)
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
                name: "Profiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Phone = table.Column<string>(type: "text", nullable: true),
                    Bio = table.Column<string>(type: "text", nullable: true),
                    Preferences = table.Column<string>(type: "text", nullable: true),
                    AvatarUrl = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Profiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Profiles_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserRoles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Role = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserRoles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserRoles_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ClientContracts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OfferId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClientId = table.Column<Guid>(type: "uuid", nullable: false),
                    AssignedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    AssignedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ActivatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SnapshotOfferName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    SnapshotVideoQuantity = table.Column<int>(type: "integer", nullable: true),
                    SnapshotPrice = table.Column<decimal>(type: "numeric", nullable: true),
                    SnapshotValidityDays = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientContracts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClientContracts_Users_AssignedBy",
                        column: x => x.AssignedBy,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ClientContracts_Users_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Offers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Category = table.Column<int>(type: "integer", nullable: false),
                    ContractType = table.Column<int>(type: "integer", nullable: false),
                    Price = table.Column<decimal>(type: "numeric", nullable: false),
                    VideoQuantity = table.Column<int>(type: "integer", nullable: false),
                    MaxDurationSeconds = table.Column<int>(type: "integer", nullable: false),
                    ValidityDays = table.Column<int>(type: "integer", nullable: true),
                    LoyaltyMonths = table.Column<int>(type: "integer", nullable: false),
                    DeliveryDays = table.Column<int>(type: "integer", nullable: false),
                    VideoFormatId = table.Column<Guid>(type: "uuid", nullable: true),
                    EditingStyleId = table.Column<Guid>(type: "uuid", nullable: true),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Features = table.Column<List<string>>(type: "text[]", nullable: false),
                    Disclaimer = table.Column<string>(type: "text", nullable: true),
                    Badge = table.Column<string>(type: "text", nullable: true),
                    IsPublic = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Offers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Offers_EditingStyles_EditingStyleId",
                        column: x => x.EditingStyleId,
                        principalTable: "EditingStyles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "VideoFormats",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    MaxDurationSeconds = table.Column<int>(type: "integer", nullable: false),
                    EditingStyleId = table.Column<Guid>(type: "uuid", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    OfferId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VideoFormats", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VideoFormats_EditingStyles_EditingStyleId",
                        column: x => x.EditingStyleId,
                        principalTable: "EditingStyles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_VideoFormats_Offers_OfferId",
                        column: x => x.OfferId,
                        principalTable: "Offers",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Orders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ClientId = table.Column<Guid>(type: "uuid", nullable: false),
                    EditorId = table.Column<Guid>(type: "uuid", nullable: true),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Briefing = table.Column<string>(type: "text", nullable: false),
                    SourceFilesUrl = table.Column<string>(type: "text", nullable: false),
                    FinalVideoUrl = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    VideoFormatId = table.Column<Guid>(type: "uuid", nullable: false),
                    Deadline = table.Column<DateOnly>(type: "date", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Orders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Orders_Users_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Orders_Users_EditorId",
                        column: x => x.EditorId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Orders_VideoFormats_VideoFormatId",
                        column: x => x.VideoFormatId,
                        principalTable: "VideoFormats",
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

            migrationBuilder.CreateTable(
                name: "ServiceBalanceLots",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    VideoFormatId = table.Column<Guid>(type: "uuid", nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    RemainingQuantity = table.Column<int>(type: "integer", nullable: false),
                    PurchasedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Source = table.Column<int>(type: "integer", nullable: false),
                    AssignmentId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ClientContractId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServiceBalanceLots", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ServiceBalanceLots_ClientContracts_ClientContractId",
                        column: x => x.ClientContractId,
                        principalTable: "ClientContracts",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ServiceBalanceLots_PackageAssignments_AssignmentId",
                        column: x => x.AssignmentId,
                        principalTable: "PackageAssignments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ServiceBalanceLots_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ServiceBalanceLots_VideoFormats_VideoFormatId",
                        column: x => x.VideoFormatId,
                        principalTable: "VideoFormats",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OrderTimelines",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrderId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ActionType = table.Column<int>(type: "integer", nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderTimelines", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrderTimelines_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OrderTimelines_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ClientContracts_AssignedBy",
                table: "ClientContracts",
                column: "AssignedBy");

            migrationBuilder.CreateIndex(
                name: "IX_ClientContracts_ClientId",
                table: "ClientContracts",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_ClientContracts_OfferId",
                table: "ClientContracts",
                column: "OfferId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_UserId",
                table: "Notifications",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Offers_EditingStyleId",
                table: "Offers",
                column: "EditingStyleId");

            migrationBuilder.CreateIndex(
                name: "IX_Offers_Slug",
                table: "Offers",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Offers_VideoFormatId",
                table: "Offers",
                column: "VideoFormatId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_ClientId",
                table: "Orders",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_EditorId",
                table: "Orders",
                column: "EditorId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_VideoFormatId",
                table: "Orders",
                column: "VideoFormatId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderTimelines_OrderId",
                table: "OrderTimelines",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderTimelines_UserId",
                table: "OrderTimelines",
                column: "UserId");

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

            migrationBuilder.CreateIndex(
                name: "IX_Profiles_Phone",
                table: "Profiles",
                column: "Phone",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Profiles_UserId",
                table: "Profiles",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ServiceBalanceLots_AssignmentId",
                table: "ServiceBalanceLots",
                column: "AssignmentId");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceBalanceLots_ClientContractId",
                table: "ServiceBalanceLots",
                column: "ClientContractId");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceBalanceLots_UserId",
                table: "ServiceBalanceLots",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceBalanceLots_VideoFormatId",
                table: "ServiceBalanceLots",
                column: "VideoFormatId");

            migrationBuilder.CreateIndex(
                name: "IX_UserRoles_UserId_Role",
                table: "UserRoles",
                columns: new[] { "UserId", "Role" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VideoFormats_EditingStyleId",
                table: "VideoFormats",
                column: "EditingStyleId");

            migrationBuilder.CreateIndex(
                name: "IX_VideoFormats_OfferId",
                table: "VideoFormats",
                column: "OfferId");

            migrationBuilder.CreateIndex(
                name: "IX_VideoFormats_Slug",
                table: "VideoFormats",
                column: "Slug",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_ClientContracts_Offers_OfferId",
                table: "ClientContracts",
                column: "OfferId",
                principalTable: "Offers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Offers_VideoFormats_VideoFormatId",
                table: "Offers",
                column: "VideoFormatId",
                principalTable: "VideoFormats",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_VideoFormats_Offers_OfferId",
                table: "VideoFormats");

            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropTable(
                name: "OrderTimelines");

            migrationBuilder.DropTable(
                name: "PackageVideoFormats");

            migrationBuilder.DropTable(
                name: "Profiles");

            migrationBuilder.DropTable(
                name: "ServiceBalanceLots");

            migrationBuilder.DropTable(
                name: "UserRoles");

            migrationBuilder.DropTable(
                name: "Orders");

            migrationBuilder.DropTable(
                name: "ClientContracts");

            migrationBuilder.DropTable(
                name: "PackageAssignments");

            migrationBuilder.DropTable(
                name: "Packages");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "Offers");

            migrationBuilder.DropTable(
                name: "VideoFormats");

            migrationBuilder.DropTable(
                name: "EditingStyles");
        }
    }
}
