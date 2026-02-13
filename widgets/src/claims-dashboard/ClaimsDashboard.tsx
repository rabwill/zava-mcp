import React, { useState, useCallback, useMemo } from "react";
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
  Select,
  Textarea,
} from "@fluentui/react-components";
import {
  TaskListLtrRegular,
  CheckmarkCircleRegular,
  DismissCircleRegular,
  ClockRegular,
  AlertRegular,
  DocumentRegular,
  ReceiptMoneyRegular,
  ArrowMaximizeRegular,
  ArrowMinimizeRegular,
  ArrowLeftRegular,
  FilterRegular,
  PersonRegular,
  LocationRegular,
  CalendarRegular,
  SearchRegular,
  BoxRegular,
  WrenchRegular,
  ImageRegular,
  EditRegular,
  SaveRegular,
  DismissRegular,
  NoteRegular,
} from "@fluentui/react-icons";
import { useOpenAiGlobal } from "../hooks/useOpenAiGlobal";
import { useThemeColors } from "../hooks/useThemeColors";
import type {
  ClaimsDashboardData,
  Claim,
  Inspection,
  PurchaseOrder,
} from "../types";

/* ─── Styles ─────────────────────────────────────────────────────────── */
const useStyles = makeStyles({
  root: { fontFamily: tokens.fontFamilyBase, width: "100%", overflow: "auto" },

  /* Grid view */
  header: { display: "flex", alignItems: "center", gap: "12px", padding: "20px 20px 0" },
  headerIcon: {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: "44px", height: "44px", borderRadius: "14px", flexShrink: 0,
  },
  toolbar: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    gap: "12px", padding: "16px 20px 4px", flexWrap: "wrap" as const,
  },
  metricsStrip: { display: "flex", gap: "16px", flexWrap: "wrap" as const },
  metric: { display: "flex", alignItems: "center", gap: "6px" },
  filterRow: { display: "flex", alignItems: "center", gap: "6px" },
  filterChip: {
    padding: "4px 12px", borderRadius: "16px", border: "1px solid",
    fontSize: "12px", cursor: "pointer", transition: "background 0.15s",
    whiteSpace: "nowrap" as const, fontFamily: tokens.fontFamilyBase,
  },
  grid: {
    display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px", padding: "16px 20px 20px",
  },
  gridCard: {
    display: "flex", flexDirection: "column" as const, borderRadius: "16px",
    overflow: "hidden", cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s",
    ":hover": { transform: "translateY(-2px)" },
  },
  cardTop: {
    padding: "16px 16px 12px", display: "flex",
    flexDirection: "column" as const, gap: "8px", flex: 1,
  },
  cardTopRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  damageRow: { display: "flex", gap: "4px", flexWrap: "wrap" as const, marginTop: "4px" },
  cardBottom: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "10px 16px", borderTop: "1px solid",
  },

  /* Detail view */
  detail: { padding: "16px", fontFamily: tokens.fontFamilyBase },
  detailHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" },
  section: { marginBottom: "16px" },
  infoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" },
  infoItem: { display: "flex", alignItems: "center", gap: "8px" },
  tags: { display: "flex", gap: "4px", flexWrap: "wrap" as const, marginTop: "4px" },
  poCard: { padding: "12px", borderRadius: "8px", marginBottom: "8px" },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  lineItemsTable: { width: "100%", borderCollapse: "collapse" as const, marginTop: "8px" },
  photoGrid: { display: "flex", gap: "8px", flexWrap: "wrap" as const, marginTop: "8px" },

  /* Shared edit */
  editBar: {
    display: "flex", gap: "8px", alignItems: "center",
    padding: "10px 12px", borderRadius: "8px", marginBottom: "12px",
  },
  editField: { marginBottom: "12px" },
  fieldLabel: { display: "block", marginBottom: "4px" },
  saveRow: { display: "flex", gap: "8px", marginTop: "8px" },
});

/* ─── Helpers ────────────────────────────────────────────────────────── */
function statusColor(s: string): "success" | "warning" | "danger" | "informative" | "important" {
  const l = s.toLowerCase();
  if (l.includes("approved") || l.includes("completed")) return "success";
  if (l.includes("pending") || l.includes("scheduled")) return "warning";
  if (l.includes("denied") || l.includes("rejected") || l.includes("cancelled")) return "danger";
  if (l.includes("closed")) return "informative";
  return "important";
}

function statusIcon(s: string) {
  const l = s.toLowerCase();
  if (l.includes("approved") || l.includes("completed")) return <CheckmarkCircleRegular />;
  if (l.includes("pending") || l.includes("scheduled")) return <ClockRegular />;
  if (l.includes("denied") || l.includes("cancelled")) return <DismissCircleRegular />;
  if (l.includes("closed")) return <DocumentRegular />;
  return <AlertRegular />;
}

function priorityColor(p: string): string {
  switch (p.toLowerCase()) {
    case "high": case "urgent": return "#d13438";
    case "medium": return "#ffb900";
    case "low": return "#107c10";
    default: return "#616161";
  }
}

/* ─── Toast ──────────────────────────────────────────────────────────── */
function Toast({ message, type, onDismiss }: { message: string; type: "success" | "error"; onDismiss: () => void }) {
  const c = type === "success"
    ? { bg: "#dff6dd", fg: "#107c10", bd: "#107c10" }
    : { bg: "#fde7e9", fg: "#d13438", bd: "#d13438" };
  return (
    <div style={{ padding: "10px 16px", borderRadius: "8px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px", backgroundColor: c.bg, border: `1px solid ${c.bd}`, color: c.fg }}>
      {type === "success" ? <CheckmarkCircleRegular /> : <AlertRegular />}
      <Text size={200} style={{ flex: 1 }}>{message}</Text>
      <button onClick={onDismiss} style={{ background: "none", border: "none", cursor: "pointer", color: c.fg, padding: "2px" }}>
        <DismissRegular style={{ fontSize: "14px" }} />
      </button>
    </div>
  );
}

/* ─── Constants ──────────────────────────────────────────────────────── */
const CLAIM_STATUSES = [
  "Open - Under Investigation", "Open - Pending Documentation",
  "Pending - Awaiting Inspection", "Pending - Under Review",
  "Approved - In Progress", "Approved - Repair Scheduled", "Approved - Payment Pending",
  "Denied", "Closed - Resolved", "Closed - Withdrawn",
];
const INSPECTION_STATUSES = ["scheduled", "in-progress", "completed", "cancelled"];
const PO_STATUSES = ["draft", "submitted", "approved", "in-progress", "completed", "rejected"];
const STATUS_FILTERS = ["All", "Open", "Pending", "Approved", "Denied", "Closed"] as const;

/* ─── Grid Card ──────────────────────────────────────────────────────── */
function ClaimCard({ claim, colors, styles, onClick }: {
  claim: Claim;
  colors: ReturnType<typeof useThemeColors>;
  styles: ReturnType<typeof useStyles>;
  onClick: () => void;
}) {
  return (
    <div className={styles.gridCard} style={{ backgroundColor: colors.surface, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }} onClick={onClick}>
      <div className={styles.cardTop}>
        <div className={styles.cardTopRow}>
          <Text weight="semibold" size={400}>{claim.claimNumber}</Text>
          <Badge appearance="filled" color={statusColor(claim.status)} icon={statusIcon(claim.status)} size="small">
            {claim.status.split(" - ")[0]}
          </Badge>
        </div>
        <div>
          <Text size={300} weight="semibold" style={{ display: "block" }}>{claim.policyHolderName}</Text>
          <Text size={200} style={{ color: colors.textSecondary }}>{claim.property}</Text>
        </div>
        <Text size={200} style={{ color: colors.textSecondary }}>
          {claim.description.length > 100 ? claim.description.slice(0, 100) + "…" : claim.description}
        </Text>
        <div className={styles.damageRow}>
          {claim.damageTypes.map((dt, i) => <Badge key={i} appearance="outline" size="small">{dt}</Badge>)}
        </div>
      </div>
      <div className={styles.cardBottom} style={{ borderColor: colors.border }}>
        <Text size={200} style={{ color: colors.textSecondary }}>{new Date(claim.dateOfLoss).toLocaleDateString()}</Text>
        <Text weight="semibold" style={{ color: colors.primary }}>${claim.estimatedLoss.toLocaleString()}</Text>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════
   MAIN COMPONENT — Client-side master-detail (no callTool navigation)
   ═════════════════════════════════════════════════════════════════════ */
export function ClaimsDashboard() {
  const styles = useStyles();
  const colors = useThemeColors();
  const data = useOpenAiGlobal("toolOutput") as ClaimsDashboardData | null;

  const claims = data?.claims ?? [];
  const allInspections = data?.inspections ?? [];
  const allPurchaseOrders = data?.purchaseOrders ?? [];
  const allContractors = data?.contractors ?? {};
  const allInspectors = data?.inspectors ?? {};

  /* ── View state ────────────────────────────────────────────────────── */
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("All");

  /* ── Detail tab & edit state ───────────────────────────────────────── */
  const [activeTab, setActiveTab] = useState("overview");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editingClaim, setEditingClaim] = useState(false);
  const [claimStatus, setClaimStatus] = useState("");
  const [claimNote, setClaimNote] = useState("");
  const [savingClaim, setSavingClaim] = useState(false);
  const [editingInspection, setEditingInspection] = useState<string | null>(null);
  const [inspStatus, setInspStatus] = useState("");
  const [inspFindings, setInspFindings] = useState("");
  const [inspActions, setInspActions] = useState("");
  const [savingInspection, setSavingInspection] = useState(false);
  const [editingPO, setEditingPO] = useState<string | null>(null);
  const [poStatus, setPOStatus] = useState("");
  const [poNote, setPONote] = useState("");
  const [savingPO, setSavingPO] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  /* ── Derived data ──────────────────────────────────────────────────── */
  const filteredClaims = useMemo(() => {
    if (activeFilter === "All") return claims;
    return claims.filter(c => c.status.toLowerCase().includes(activeFilter.toLowerCase()));
  }, [claims, activeFilter]);

  const metrics = useMemo(() => ({
    total: claims.length,
    totalLoss: claims.reduce((s, c) => s + c.estimatedLoss, 0),
    open: claims.filter(c => c.status.toLowerCase().includes("open")).length,
    approved: claims.filter(c => c.status.toLowerCase().includes("approved")).length,
    pending: claims.filter(c => c.status.toLowerCase().includes("pending")).length,
  }), [claims]);

  const selectedClaim = useMemo(() =>
    claims.find(c => c.id === selectedClaimId) ?? null,
  [claims, selectedClaimId]);

  const claimInspections = useMemo(() =>
    selectedClaimId ? allInspections.filter(i => i.claimId === selectedClaimId) : [],
  [allInspections, selectedClaimId]);

  const claimPOs = useMemo(() =>
    selectedClaimId ? allPurchaseOrders.filter(po => po.claimId === selectedClaimId) : [],
  [allPurchaseOrders, selectedClaimId]);

  /* ── Navigation ────────────────────────────────────────────────────── */
  const openDetail = useCallback((claim: Claim) => {
    setSelectedClaimId(claim.id);
    setActiveTab("overview");
    setEditingClaim(false);
    setEditingInspection(null);
    setEditingPO(null);
  }, []);

  const goBack = useCallback(() => {
    setSelectedClaimId(null);
    setEditingClaim(false);
    setEditingInspection(null);
    setEditingPO(null);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (window.openai?.requestDisplayMode) {
      const cur = window.openai.displayMode;
      await window.openai.requestDisplayMode({ mode: cur === "fullscreen" ? "inline" : "fullscreen" });
      setIsFullscreen(p => !p);
      return;
    }
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch {}
    setIsFullscreen(p => !p);
  }, []);

  /* ── Save handlers ─────────────────────────────────────────────────── */
  const handleSaveClaim = useCallback(async () => {
    if (!window.openai?.callTool || !selectedClaim) return;
    setSavingClaim(true);
    try {
      const a: Record<string, unknown> = { claimId: selectedClaim.id, status: claimStatus };
      if (claimNote.trim()) a.note = claimNote.trim();
      await window.openai.callTool("update-claim-status", a);
      showToast(`Claim updated to "${claimStatus}"`, "success");
      setEditingClaim(false);
      setClaimNote("");
    } catch (e) {
      showToast(`Failed: ${e instanceof Error ? e.message : "Unknown error"}`, "error");
    } finally { setSavingClaim(false); }
  }, [selectedClaim, claimStatus, claimNote]);

  const handleSaveInspection = useCallback(async (inspId: string) => {
    if (!window.openai?.callTool) return;
    setSavingInspection(true);
    try {
      const a: Record<string, unknown> = { inspectionId: inspId };
      if (inspStatus) a.status = inspStatus;
      if (inspFindings.trim()) a.findings = inspFindings.trim();
      if (inspActions.trim()) a.recommendedActions = inspActions.split("\n").map(s => s.trim()).filter(Boolean);
      await window.openai.callTool("update-inspection", a);
      showToast(`Inspection ${inspId} updated`, "success");
      setEditingInspection(null);
    } catch (e) {
      showToast(`Failed: ${e instanceof Error ? e.message : "Unknown error"}`, "error");
    } finally { setSavingInspection(false); }
  }, [inspStatus, inspFindings, inspActions]);

  const handleSavePO = useCallback(async (poId: string) => {
    if (!window.openai?.callTool) return;
    setSavingPO(true);
    try {
      const a: Record<string, unknown> = { purchaseOrderId: poId, status: poStatus };
      if (poNote.trim()) a.note = poNote.trim();
      await window.openai.callTool("update-purchase-order", a);
      showToast(`PO updated to "${poStatus}"`, "success");
      setEditingPO(null);
      setPONote("");
    } catch (e) {
      showToast(`Failed: ${e instanceof Error ? e.message : "Unknown error"}`, "error");
    } finally { setSavingPO(false); }
  }, [poStatus, poNote]);

  /* ── Edit-mode launchers ───────────────────────────────────────────── */
  const startEditClaim = useCallback(() => {
    if (!selectedClaim) return;
    setClaimStatus(selectedClaim.status);
    setClaimNote("");
    setEditingClaim(true);
  }, [selectedClaim]);

  const startEditInspection = useCallback((insp: Inspection) => {
    setInspStatus(insp.status);
    setInspFindings(insp.findings || "");
    setInspActions((insp.recommendedActions || []).join("\n"));
    setEditingInspection(insp.id);
  }, []);

  const startEditPO = useCallback((po: PurchaseOrder) => {
    setPOStatus(po.status);
    setPONote("");
    setEditingPO(po.id);
  }, []);

  /* ═══════════════════════════════════════════════════════════════════
     DETAIL VIEW
     ═══════════════════════════════════════════════════════════════════ */
  if (selectedClaim) {
    const claim = selectedClaim;
    const inspections = claimInspections;
    const purchaseOrders = claimPOs;

    return (
      <div className={styles.detail} style={{ backgroundColor: colors.background, color: colors.text }}>
        {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

        {/* Header */}
        <div className={styles.detailHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Button icon={<ArrowLeftRegular />} appearance="subtle" onClick={goBack} title="Back to Claims" size="small" />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <Text size={600} weight="bold">{claim.claimNumber}</Text>
                <Badge appearance="filled" color={statusColor(claim.status)}>{claim.status.split(" - ")[0]}</Badge>
              </div>
              <Text size={200} style={{ color: colors.textSecondary }}>{claim.status}</Text>
            </div>
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            {!editingClaim && (
              <Button icon={<EditRegular />} appearance="subtle" onClick={startEditClaim} title="Edit claim" size="small" />
            )}
            <Button icon={isFullscreen ? <ArrowMinimizeRegular /> : <ArrowMaximizeRegular />} appearance="subtle" onClick={toggleFullscreen} />
          </div>
        </div>

        {/* Tabs */}
        <TabList selectedValue={activeTab} onTabSelect={(_, d) => setActiveTab(d.value as string)} style={{ marginBottom: "16px" }}>
          <Tab value="overview" icon={<DocumentRegular />}>Overview</Tab>
          <Tab value="inspections" icon={<SearchRegular />}>Inspections ({inspections.length})</Tab>
          <Tab value="purchase-orders" icon={<BoxRegular />}>Purchase Orders ({purchaseOrders.length})</Tab>
        </TabList>

        {/* ── Overview ─────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <>
            {editingClaim && (
              <div className={styles.editBar} style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div>
                    <Text size={200} weight="semibold" className={styles.fieldLabel}>Status</Text>
                    <Select value={claimStatus} onChange={(_, d) => setClaimStatus(d.value)} style={{ width: "100%" }}>
                      {CLAIM_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                  </div>
                  <div>
                    <Text size={200} weight="semibold" className={styles.fieldLabel}>Add Note (optional)</Text>
                    <Textarea value={claimNote} onChange={(_, d) => setClaimNote(d.value)} placeholder="Add a note…" resize="vertical" style={{ width: "100%" }} />
                  </div>
                  <div className={styles.saveRow}>
                    <Button appearance="primary" icon={<SaveRegular />} onClick={handleSaveClaim} disabled={savingClaim} size="small">
                      {savingClaim ? "Saving…" : "Save Changes"}
                    </Button>
                    <Button appearance="subtle" icon={<DismissRegular />} onClick={() => setEditingClaim(false)} size="small">Cancel</Button>
                  </div>
                </div>
              </div>
            )}

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
                {claim.damageTypes.map((dt, i) => <Badge key={i} appearance="outline" color="danger">{dt}</Badge>)}
              </div>
            </div>

            <div className={styles.section}>
              <Text weight="semibold" block style={{ marginBottom: "4px" }}>Policy Number</Text>
              <Text>{claim.policyNumber}</Text>
            </div>

            {claim.notes.length > 0 && (
              <div className={styles.section}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                  <NoteRegular style={{ color: colors.primary }} />
                  <Text weight="semibold">Notes ({claim.notes.length})</Text>
                </div>
                {claim.notes.map((n, i) => (
                  <Text key={i} size={200} block style={{ color: colors.textSecondary, paddingLeft: "4px", marginBottom: "2px" }}>• {n}</Text>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Inspections ──────────────────────────────────────────── */}
        {activeTab === "inspections" && (
          <div className={styles.section}>
            {inspections.length === 0 ? (
              <Text style={{ color: colors.textSecondary }}>No inspections recorded.</Text>
            ) : (
              <Accordion multiple collapsible>
                {inspections.map(insp => {
                  const inspector = allInspectors[insp.inspectorId];
                  const isEditing = editingInspection === insp.id;
                  return (
                    <AccordionItem key={insp.id} value={insp.id}>
                      <AccordionHeader>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", width: "100%" }}>
                          {insp.status === "completed"
                            ? <CheckmarkCircleRegular style={{ color: colors.success }} />
                            : <ClockRegular style={{ color: colors.warning }} />}
                          <Text weight="semibold">{insp.id}</Text>
                          <Badge appearance="tint" size="small">{insp.taskType}</Badge>
                          <Badge appearance="filled" size="small" style={{ backgroundColor: priorityColor(insp.priority), color: "#fff" }}>{insp.priority}</Badge>
                          <Badge appearance="outline" size="small" color={statusColor(insp.status)}>{insp.status}</Badge>
                        </div>
                      </AccordionHeader>
                      <AccordionPanel>
                        <div style={{ padding: "8px 0" }}>
                          <Text size={200} style={{ color: colors.textSecondary }} block>
                            Scheduled: {new Date(insp.scheduledDate).toLocaleDateString()}
                            {insp.completedDate && ` · Completed: ${new Date(insp.completedDate).toLocaleDateString()}`}
                          </Text>
                          {inspector && <Text size={200} block style={{ marginTop: "4px" }}>Inspector: {inspector.name} ({inspector.email})</Text>}
                          <Text size={200} block style={{ marginTop: "4px" }}>Property: {insp.property}</Text>

                          {isEditing ? (
                            <div style={{ marginTop: "12px", padding: "12px", backgroundColor: colors.surface, borderRadius: "8px", border: `1px solid ${colors.border}` }}>
                              <div className={styles.editField}>
                                <Text size={200} weight="semibold" className={styles.fieldLabel}>Status</Text>
                                <Select value={inspStatus} onChange={(_, d) => setInspStatus(d.value)} style={{ width: "100%" }}>
                                  {INSPECTION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </Select>
                              </div>
                              <div className={styles.editField}>
                                <Text size={200} weight="semibold" className={styles.fieldLabel}>Findings</Text>
                                <Textarea value={inspFindings} onChange={(_, d) => setInspFindings(d.value)} placeholder="Enter findings…" resize="vertical" style={{ width: "100%" }} />
                              </div>
                              <div className={styles.editField}>
                                <Text size={200} weight="semibold" className={styles.fieldLabel}>Recommended Actions (one per line)</Text>
                                <Textarea value={inspActions} onChange={(_, d) => setInspActions(d.value)} placeholder="One action per line…" resize="vertical" style={{ width: "100%" }} />
                              </div>
                              <div className={styles.saveRow}>
                                <Button appearance="primary" icon={<SaveRegular />} onClick={() => handleSaveInspection(insp.id)} disabled={savingInspection} size="small">
                                  {savingInspection ? "Saving…" : "Save"}
                                </Button>
                                <Button appearance="subtle" icon={<DismissRegular />} onClick={() => setEditingInspection(null)} size="small">Cancel</Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {insp.findings && (
                                <div style={{ marginTop: "8px", padding: "8px", backgroundColor: colors.surface, borderRadius: "4px" }}>
                                  <Text size={200} weight="semibold" block>Findings</Text>
                                  <Text size={200}>{insp.findings}</Text>
                                </div>
                              )}
                              {insp.recommendedActions.length > 0 && (
                                <div style={{ marginTop: "8px" }}>
                                  <Text size={200} weight="semibold" block>Recommended Actions</Text>
                                  {insp.recommendedActions.map((a, i) => <Text key={i} size={200} block>• {a}</Text>)}
                                </div>
                              )}
                              {insp.flaggedIssues.length > 0 && (
                                <div style={{ marginTop: "8px" }}>
                                  <Text size={200} weight="semibold" block style={{ color: colors.error }}><AlertRegular /> Flagged Issues</Text>
                                  {insp.flaggedIssues.map((issue, i) => <Text key={i} size={200} block style={{ color: colors.error }}>• {issue}</Text>)}
                                </div>
                              )}
                              {insp.photos.length > 0 && (
                                <div style={{ marginTop: "8px" }}>
                                  <Text size={200} weight="semibold" block><ImageRegular /> Photos</Text>
                                  <div className={styles.photoGrid}>
                                    {insp.photos.map((p, i) => (
                                      <Image key={i} src={p} alt={`Photo ${i + 1}`} width={120} height={90} fit="cover" style={{ borderRadius: "4px", border: `1px solid ${colors.border}` }} />
                                    ))}
                                  </div>
                                </div>
                              )}
                              <Button icon={<EditRegular />} appearance="subtle" size="small" onClick={() => startEditInspection(insp)} style={{ marginTop: "8px" }}>
                                Edit Inspection
                              </Button>
                            </>
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

        {/* ── Purchase Orders ──────────────────────────────────────── */}
        {activeTab === "purchase-orders" && (
          <div className={styles.section}>
            {purchaseOrders.length === 0 ? (
              <Text style={{ color: colors.textSecondary }}>No purchase orders recorded.</Text>
            ) : (
              purchaseOrders.map(po => {
                const contractor = allContractors[po.contractorId];
                const isEditing = editingPO === po.id;
                return (
                  <Card key={po.id} className={styles.poCard} style={{ backgroundColor: colors.surface }}>
                    <CardHeader
                      header={
                        <div className={styles.row} style={{ width: "100%" }}>
                          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <BoxRegular style={{ color: colors.primary }} />
                            <Text weight="semibold">{po.poNumber}</Text>
                            <Badge appearance="filled" color={statusColor(po.status)}>{po.status}</Badge>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <Text weight="bold" style={{ color: colors.primary }}>${po.total.toLocaleString()}</Text>
                            {!isEditing && <Button icon={<EditRegular />} appearance="subtle" size="small" onClick={() => startEditPO(po)} title="Edit PO" />}
                          </div>
                        </div>
                      }
                      description={<Text size={200} style={{ color: colors.textSecondary }}>{po.workDescription}</Text>}
                    />

                    {isEditing && (
                      <div style={{ marginTop: "10px", padding: "12px", borderRadius: "8px", border: `1px solid ${colors.border}`, backgroundColor: colors.background }}>
                        <div className={styles.editField}>
                          <Text size={200} weight="semibold" className={styles.fieldLabel}>Status</Text>
                          <Select value={poStatus} onChange={(_, d) => setPOStatus(d.value)} style={{ width: "100%" }}>
                            {PO_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </Select>
                        </div>
                        <div className={styles.editField}>
                          <Text size={200} weight="semibold" className={styles.fieldLabel}>Add Note (optional)</Text>
                          <Textarea value={poNote} onChange={(_, d) => setPONote(d.value)} placeholder="Add a note…" resize="vertical" style={{ width: "100%" }} />
                        </div>
                        <div className={styles.saveRow}>
                          <Button appearance="primary" icon={<SaveRegular />} onClick={() => handleSavePO(po.id)} disabled={savingPO} size="small">
                            {savingPO ? "Saving…" : "Save"}
                          </Button>
                          <Button appearance="subtle" icon={<DismissRegular />} onClick={() => setEditingPO(null)} size="small">Cancel</Button>
                        </div>
                      </div>
                    )}

                    {contractor && (
                      <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <WrenchRegular style={{ color: colors.primary }} />
                        <Text size={200}>Contractor: <strong>{contractor.name}</strong> — {contractor.businessName}</Text>
                        {contractor.isPreferred && <Badge appearance="tint" size="small" color="success">Preferred</Badge>}
                      </div>
                    )}

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
                          <tr><td colSpan={3} style={{ textAlign: "right", padding: "4px 8px", fontSize: "12px" }}>Subtotal:</td><td style={{ textAlign: "right", padding: "4px 8px", fontSize: "12px", fontWeight: "bold" }}>${po.subtotal.toLocaleString()}</td></tr>
                          <tr><td colSpan={3} style={{ textAlign: "right", padding: "4px 8px", fontSize: "12px" }}>Tax:</td><td style={{ textAlign: "right", padding: "4px 8px", fontSize: "12px" }}>${po.tax.toLocaleString()}</td></tr>
                          <tr><td colSpan={3} style={{ textAlign: "right", padding: "4px 8px", fontSize: "12px", fontWeight: "bold" }}>Total:</td><td style={{ textAlign: "right", padding: "4px 8px", fontSize: "12px", fontWeight: "bold", color: colors.primary }}>${po.total.toLocaleString()}</td></tr>
                        </tfoot>
                      </table>
                    )}

                    {po.notes && po.notes.length > 0 && (
                      <div style={{ marginTop: "8px" }}>
                        <Text size={200} weight="semibold" block>Notes</Text>
                        {po.notes.map((n, i) => <Text key={i} size={200} block style={{ color: colors.textSecondary }}>• {n}</Text>)}
                      </div>
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

  /* ═══════════════════════════════════════════════════════════════════
     GRID VIEW (default)
     ═══════════════════════════════════════════════════════════════════ */
  return (
    <div className={styles.root} style={{ backgroundColor: colors.background, color: colors.text }}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerIcon} style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}>
          <TaskListLtrRegular style={{ fontSize: "22px" }} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <Text size={500} weight="bold" style={{ display: "block" }}>Zava Insurance — Claims</Text>
          <Text size={200} style={{ color: colors.textSecondary }}>
            {claims.length} claims · ${metrics.totalLoss.toLocaleString()} estimated loss
          </Text>
        </div>
        <button onClick={toggleFullscreen} title="Fullscreen" style={{ background: "none", border: "none", cursor: "pointer", color: colors.textSecondary, padding: "6px" }}>
          <ArrowMaximizeRegular style={{ fontSize: "18px" }} />
        </button>
      </div>

      {/* Toolbar: Metrics + Filter */}
      <div className={styles.toolbar}>
        <div className={styles.metricsStrip}>
          {[
            { label: "Open", value: metrics.open, color: colors.error },
            { label: "Pending", value: metrics.pending, color: colors.warning },
            { label: "Approved", value: metrics.approved, color: colors.success },
          ].map(m => (
            <div key={m.label} className={styles.metric}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: m.color, display: "inline-block" }} />
              <Text size={200} style={{ color: colors.textSecondary }}>{m.value} {m.label}</Text>
            </div>
          ))}
          <div className={styles.metric}>
            <ReceiptMoneyRegular style={{ fontSize: "14px", color: colors.textSecondary }} />
            <Text size={200} style={{ color: colors.textSecondary }}>${metrics.totalLoss.toLocaleString()}</Text>
          </div>
        </div>
        <div className={styles.filterRow}>
          <FilterRegular style={{ fontSize: "14px", color: colors.textSecondary }} />
          {STATUS_FILTERS.map(f => {
            const isActive = activeFilter === f;
            return (
              <button key={f} className={styles.filterChip} style={{
                backgroundColor: isActive ? colors.primary : "transparent",
                color: isActive ? "#fff" : colors.textSecondary,
                borderColor: isActive ? colors.primary : colors.border,
              }} onClick={() => setActiveFilter(f)}>
                {f}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      {filteredClaims.length === 0 ? (
        <div style={{ padding: "40px 20px", textAlign: "center" }}>
          <Text style={{ color: colors.textSecondary }}>No claims match the "{activeFilter}" filter.</Text>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredClaims.map(claim => (
            <ClaimCard key={claim.id} claim={claim} colors={colors} styles={styles} onClick={() => openDetail(claim)} />
          ))}
        </div>
      )}
    </div>
  );
}
