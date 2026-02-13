import React, { useState, useCallback } from "react";
import {
  makeStyles,
  Text,
  Badge,
  Card,
  CardHeader,
  Button,
  Divider,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
  Tab,
  TabList,
  tokens,
  Image,
} from "@fluentui/react-components";
import {
  ArrowMaximizeRegular,
  ArrowMinimizeRegular,
  PersonRegular,
  LocationRegular,
  CalendarRegular,
  ReceiptMoneyRegular,
  DocumentRegular,
  SearchRegular,
  BoxRegular,
  WrenchRegular,
  CheckmarkCircleRegular,
  ClockRegular,
  AlertRegular,
  ImageRegular,
} from "@fluentui/react-icons";
import { useOpenAiGlobal } from "../hooks/useOpenAiGlobal";
import { useThemeColors } from "../hooks/useThemeColors";
import type { ClaimDetailData, Claim, Inspection, PurchaseOrder } from "../types";

const useStyles = makeStyles({
  container: { padding: "16px", fontFamily: tokens.fontFamilyBase },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" },
  section: { marginBottom: "16px" },
  infoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" },
  infoItem: { display: "flex", alignItems: "center", gap: "8px" },
  card: { padding: "12px", borderRadius: "8px", marginBottom: "8px" },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  tags: { display: "flex", gap: "4px", flexWrap: "wrap" as const, marginTop: "4px" },
  lineItemsTable: { width: "100%", borderCollapse: "collapse" as const, marginTop: "8px" },
  photoGrid: { display: "flex", gap: "8px", flexWrap: "wrap" as const, marginTop: "8px" },
});

function statusBadgeColor(status: string): "success" | "warning" | "danger" | "informative" | "important" {
  const lower = status.toLowerCase();
  if (lower.includes("completed") || lower.includes("approved")) return "success";
  if (lower.includes("pending") || lower.includes("scheduled")) return "warning";
  if (lower.includes("cancelled") || lower.includes("rejected")) return "danger";
  return "important";
}

function priorityColor(priority: string): string {
  switch (priority.toLowerCase()) {
    case "high": case "urgent": return "#d13438";
    case "medium": return "#ffb900";
    case "low": return "#107c10";
    default: return "#616161";
  }
}

export function ClaimDetail() {
  const styles = useStyles();
  const colors = useThemeColors();
  const data = useOpenAiGlobal("toolOutput") as ClaimDetailData | null;

  const [activeTab, setActiveTab] = useState("overview");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(async () => {
    if (window.openai?.requestDisplayMode) {
      const current = window.openai.displayMode;
      await window.openai.requestDisplayMode({ mode: current === "fullscreen" ? "inline" : "fullscreen" });
      return;
    }
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch {}
    setIsFullscreen(prev => !prev);
  }, []);

  if (!data?.claim) {
    return (
      <div className={styles.container} style={{ backgroundColor: colors.background, color: colors.text }}>
        <Text>No claim data available.</Text>
      </div>
    );
  }

  const { claim, inspections = [], purchaseOrders = [], contractors = {}, inspectors = {} } = data;

  return (
    <div className={styles.container} style={{ backgroundColor: colors.background, color: colors.text }}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Text size={600} weight="bold">{claim.claimNumber}</Text>
            <Badge appearance="filled" color={statusBadgeColor(claim.status)}>
              {claim.status.split(" - ")[0]}
            </Badge>
          </div>
          <Text size={200} style={{ color: colors.textSecondary }}>
            {claim.status}
          </Text>
        </div>
        <Button
          icon={isFullscreen ? <ArrowMinimizeRegular /> : <ArrowMaximizeRegular />}
          appearance="subtle"
          onClick={toggleFullscreen}
        />
      </div>

      {/* Tabs */}
      <TabList selectedValue={activeTab} onTabSelect={(_, d) => setActiveTab(d.value as string)} style={{ marginBottom: "16px" }}>
        <Tab value="overview" icon={<DocumentRegular />}>Overview</Tab>
        <Tab value="inspections" icon={<SearchRegular />}>Inspections ({inspections.length})</Tab>
        <Tab value="purchase-orders" icon={<BoxRegular />}>Purchase Orders ({purchaseOrders.length})</Tab>
      </TabList>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <PersonRegular style={{ color: colors.primary }} />
              <div>
                <Text size={200} style={{ color: colors.textSecondary }} block>Policy Holder</Text>
                <Text weight="semibold">{claim.policyHolderName}</Text>
                <Text size={200} block style={{ color: colors.textSecondary }}>{claim.policyHolderEmail}</Text>
              </div>
            </div>
            <div className={styles.infoItem}>
              <LocationRegular style={{ color: colors.primary }} />
              <div>
                <Text size={200} style={{ color: colors.textSecondary }} block>Property</Text>
                <Text weight="semibold">{claim.property}</Text>
              </div>
            </div>
            <div className={styles.infoItem}>
              <CalendarRegular style={{ color: colors.primary }} />
              <div>
                <Text size={200} style={{ color: colors.textSecondary }} block>Date of Loss</Text>
                <Text weight="semibold">{new Date(claim.dateOfLoss).toLocaleDateString()}</Text>
              </div>
            </div>
            <div className={styles.infoItem}>
              <ReceiptMoneyRegular style={{ color: colors.primary }} />
              <div>
                <Text size={200} style={{ color: colors.textSecondary }} block>Estimated Loss</Text>
                <Text weight="semibold" style={{ color: colors.error }}>${claim.estimatedLoss.toLocaleString()}</Text>
              </div>
            </div>
          </div>

          <Divider />

          <div className={styles.section} style={{ marginTop: "12px" }}>
            <Text weight="semibold" block style={{ marginBottom: "4px" }}>Description</Text>
            <Text>{claim.description}</Text>
          </div>

          <div className={styles.section}>
            <Text weight="semibold" block style={{ marginBottom: "4px" }}>Damage Types</Text>
            <div className={styles.tags}>
              {claim.damageTypes.map((dt, i) => (
                <Badge key={i} appearance="outline" color="danger">{dt}</Badge>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <Text weight="semibold" block style={{ marginBottom: "4px" }}>Policy Number</Text>
            <Text>{claim.policyNumber}</Text>
          </div>

          {claim.notes.length > 0 && (
            <div className={styles.section}>
              <Text weight="semibold" block style={{ marginBottom: "4px" }}>Notes</Text>
              {claim.notes.map((n, i) => (
                <Text key={i} size={200} block style={{ color: colors.textSecondary }}>• {n}</Text>
              ))}
            </div>
          )}
        </>
      )}

      {/* Inspections Tab */}
      {activeTab === "inspections" && (
        <div className={styles.section}>
          {inspections.length === 0 ? (
            <Text style={{ color: colors.textSecondary }}>No inspections recorded.</Text>
          ) : (
            <Accordion multiple collapsible>
              {inspections.map(insp => {
                const inspector = inspectors[insp.inspectorId];
                return (
                  <AccordionItem key={insp.id} value={insp.id}>
                    <AccordionHeader>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", width: "100%" }}>
                        {insp.status === "completed" ? (
                          <CheckmarkCircleRegular style={{ color: colors.success }} />
                        ) : (
                          <ClockRegular style={{ color: colors.warning }} />
                        )}
                        <Text weight="semibold">{insp.id}</Text>
                        <Badge appearance="tint" size="small">{insp.taskType}</Badge>
                        <Badge
                          appearance="filled"
                          size="small"
                          style={{ backgroundColor: priorityColor(insp.priority), color: "#fff" }}
                        >
                          {insp.priority}
                        </Badge>
                        <Badge appearance="outline" size="small" color={statusBadgeColor(insp.status)}>
                          {insp.status}
                        </Badge>
                      </div>
                    </AccordionHeader>
                    <AccordionPanel>
                      <div style={{ padding: "8px 0" }}>
                        <Text size={200} style={{ color: colors.textSecondary }} block>
                          📅 Scheduled: {new Date(insp.scheduledDate).toLocaleDateString()}
                          {insp.completedDate && ` · Completed: ${new Date(insp.completedDate).toLocaleDateString()}`}
                        </Text>
                        {inspector && (
                          <Text size={200} block style={{ marginTop: "4px" }}>
                            👷 Inspector: {inspector.name} ({inspector.email})
                          </Text>
                        )}
                        <Text size={200} block style={{ marginTop: "4px" }}>
                          📍 {insp.property}
                        </Text>
                        {insp.findings && (
                          <div style={{ marginTop: "8px", padding: "8px", backgroundColor: colors.surface, borderRadius: "4px" }}>
                            <Text size={200} weight="semibold" block>Findings</Text>
                            <Text size={200}>{insp.findings}</Text>
                          </div>
                        )}
                        {insp.recommendedActions.length > 0 && (
                          <div style={{ marginTop: "8px" }}>
                            <Text size={200} weight="semibold" block>Recommended Actions</Text>
                            {insp.recommendedActions.map((a, i) => (
                              <Text key={i} size={200} block>• {a}</Text>
                            ))}
                          </div>
                        )}
                        {insp.flaggedIssues.length > 0 && (
                          <div style={{ marginTop: "8px" }}>
                            <Text size={200} weight="semibold" block style={{ color: colors.error }}>
                              <AlertRegular /> Flagged Issues
                            </Text>
                            {insp.flaggedIssues.map((issue, i) => (
                              <Text key={i} size={200} block style={{ color: colors.error }}>⚠️ {issue}</Text>
                            ))}
                          </div>
                        )}
                        {insp.photos.length > 0 && (
                          <div style={{ marginTop: "8px" }}>
                            <Text size={200} weight="semibold" block><ImageRegular /> Photos</Text>
                            <div className={styles.photoGrid}>
                              {insp.photos.map((p, i) => (
                                <Image
                                  key={i}
                                  src={p}
                                  alt={`Inspection photo ${i + 1}`}
                                  width={120}
                                  height={90}
                                  fit="cover"
                                  style={{ borderRadius: "4px", border: `1px solid ${colors.border}` }}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </AccordionPanel>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </div>
      )}

      {/* Purchase Orders Tab */}
      {activeTab === "purchase-orders" && (
        <div className={styles.section}>
          {purchaseOrders.length === 0 ? (
            <Text style={{ color: colors.textSecondary }}>No purchase orders recorded.</Text>
          ) : (
            purchaseOrders.map(po => {
              const contractor = contractors[po.contractorId];
              return (
                <Card key={po.id} className={styles.card} style={{ backgroundColor: colors.surface }}>
                  <CardHeader
                    header={
                      <div className={styles.row} style={{ width: "100%" }}>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <BoxRegular style={{ color: colors.primary }} />
                          <Text weight="semibold">{po.poNumber}</Text>
                          <Badge appearance="filled" color={statusBadgeColor(po.status)}>{po.status}</Badge>
                        </div>
                        <Text weight="bold" style={{ color: colors.primary }}>${po.total.toLocaleString()}</Text>
                      </div>
                    }
                    description={
                      <Text size={200} style={{ color: colors.textSecondary }}>
                        {po.workDescription}
                      </Text>
                    }
                  />
                  {contractor && (
                    <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <WrenchRegular style={{ color: colors.primary }} />
                      <Text size={200}>
                        Contractor: <strong>{contractor.name}</strong> — {contractor.businessName}
                      </Text>
                      {contractor.isPreferred && <Badge appearance="tint" size="small" color="success">Preferred</Badge>}
                    </div>
                  )}

                  {/* Line Items */}
                  {Array.isArray(po.lineItems) && po.lineItems.length > 0 && (
                    <table className={styles.lineItemsTable} style={{ marginTop: "8px" }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                          <th style={{ textAlign: "left", padding: "4px 8px", fontSize: "12px", color: colors.textSecondary }}>Description</th>
                          <th style={{ textAlign: "right", padding: "4px 8px", fontSize: "12px", color: colors.textSecondary }}>Qty</th>
                          <th style={{ textAlign: "right", padding: "4px 8px", fontSize: "12px", color: colors.textSecondary }}>Unit Price</th>
                          <th style={{ textAlign: "right", padding: "4px 8px", fontSize: "12px", color: colors.textSecondary }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {po.lineItems.map(li => (
                          <tr key={li.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                            <td style={{ padding: "4px 8px", fontSize: "12px" }}>{li.description}</td>
                            <td style={{ textAlign: "right", padding: "4px 8px", fontSize: "12px" }}>{li.quantity}</td>
                            <td style={{ textAlign: "right", padding: "4px 8px", fontSize: "12px" }}>${li.unitPrice}</td>
                            <td style={{ textAlign: "right", padding: "4px 8px", fontSize: "12px" }}>${li.totalPrice.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={3} style={{ textAlign: "right", padding: "4px 8px", fontSize: "12px" }}>Subtotal:</td>
                          <td style={{ textAlign: "right", padding: "4px 8px", fontSize: "12px", fontWeight: "bold" }}>${po.subtotal.toLocaleString()}</td>
                        </tr>
                        <tr>
                          <td colSpan={3} style={{ textAlign: "right", padding: "4px 8px", fontSize: "12px" }}>Tax:</td>
                          <td style={{ textAlign: "right", padding: "4px 8px", fontSize: "12px" }}>${po.tax.toLocaleString()}</td>
                        </tr>
                        <tr>
                          <td colSpan={3} style={{ textAlign: "right", padding: "4px 8px", fontSize: "12px", fontWeight: "bold" }}>Total:</td>
                          <td style={{ textAlign: "right", padding: "4px 8px", fontSize: "12px", fontWeight: "bold", color: colors.primary }}>${po.total.toLocaleString()}</td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
