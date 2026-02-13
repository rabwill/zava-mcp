import React, { useState, useCallback, useMemo } from "react";
import {
  makeStyles,
  Text,
  Badge,
  Card,
  CardHeader,
  Input,
  Select,
  Button,
  Divider,
  tokens,
} from "@fluentui/react-components";
import {
  SearchRegular,
  ArrowMaximizeRegular,
  ArrowMinimizeRegular,
  TaskListLtrRegular,
  ReceiptMoneyRegular,
  AlertRegular,
  CheckmarkCircleRegular,
  DismissCircleRegular,
  ClockRegular,
  DocumentRegular,
} from "@fluentui/react-icons";
import { useOpenAiGlobal } from "../hooks/useOpenAiGlobal";
import { useThemeColors } from "../hooks/useThemeColors";
import type { ClaimsDashboardData, Claim } from "../types";

const useStyles = makeStyles({
  container: { padding: "16px", fontFamily: tokens.fontFamilyBase },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
  filters: { display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" },
  metricsRow: { display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" },
  metricCard: { flex: "1 1 140px", padding: "12px", borderRadius: "8px", textAlign: "center" as const },
  grid: { display: "flex", flexDirection: "column" as const, gap: "8px" },
  claimCard: { padding: "12px", borderRadius: "8px", cursor: "pointer", transition: "box-shadow 0.2s" },
  cardRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" },
  tags: { display: "flex", gap: "4px", flexWrap: "wrap" as const, marginTop: "4px" },
});

function getStatusColor(status: string): "success" | "warning" | "danger" | "informative" | "important" {
  const lower = status.toLowerCase();
  if (lower.includes("approved")) return "success";
  if (lower.includes("pending")) return "warning";
  if (lower.includes("denied") || lower.includes("rejected")) return "danger";
  if (lower.includes("closed")) return "informative";
  return "important";
}

function getStatusIcon(status: string) {
  const lower = status.toLowerCase();
  if (lower.includes("approved")) return <CheckmarkCircleRegular />;
  if (lower.includes("pending")) return <ClockRegular />;
  if (lower.includes("denied")) return <DismissCircleRegular />;
  if (lower.includes("closed")) return <DocumentRegular />;
  return <AlertRegular />;
}

const SAMPLE_CLAIMS: Claim[] = [
  {
    id: "1", claimNumber: "CN202504990", policyNumber: "POL-HO-2025-001",
    policyHolderName: "Sample User", policyHolderEmail: "sample@email.com",
    property: "123 Main St", dateOfLoss: "2025-01-01", dateReported: "2025-01-02",
    status: "Open - Under Investigation", damageTypes: ["Fire damage"],
    description: "Sample claim", estimatedLoss: 25000, adjusterAssigned: "adj-001",
    notes: [], createdAt: "2025-01-02", updatedAt: "2025-01-03",
  },
];

export function ClaimsDashboard() {
  const styles = useStyles();
  const colors = useThemeColors();
  const toolOutput = useOpenAiGlobal("toolOutput") as ClaimsDashboardData | null;
  const claims = toolOutput?.claims ?? SAMPLE_CLAIMS;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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

  const statuses = useMemo(() => {
    const set = new Set(claims.map(c => {
      const s = c.status.toLowerCase();
      if (s.includes("approved")) return "Approved";
      if (s.includes("pending")) return "Pending";
      if (s.includes("denied")) return "Denied";
      if (s.includes("closed")) return "Closed";
      if (s.includes("open")) return "Open";
      return "Other";
    }));
    return Array.from(set).sort();
  }, [claims]);

  const filtered = useMemo(() => {
    return claims.filter(c => {
      const matchesSearch = !search ||
        c.claimNumber.toLowerCase().includes(search.toLowerCase()) ||
        c.policyHolderName.toLowerCase().includes(search.toLowerCase()) ||
        c.property.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" ||
        c.status.toLowerCase().includes(statusFilter.toLowerCase());
      return matchesSearch && matchesStatus;
    });
  }, [claims, search, statusFilter]);

  const metrics = useMemo(() => {
    const total = claims.length;
    const totalLoss = claims.reduce((sum, c) => sum + c.estimatedLoss, 0);
    const open = claims.filter(c => c.status.toLowerCase().includes("open")).length;
    const approved = claims.filter(c => c.status.toLowerCase().includes("approved")).length;
    const pending = claims.filter(c => c.status.toLowerCase().includes("pending")).length;
    return { total, totalLoss, open, approved, pending };
  }, [claims]);

  const handleClaimClick = useCallback(async (claim: Claim) => {
    if (window.openai?.callTool) {
      await window.openai.callTool("show-claim-detail", { claimId: claim.id });
    }
  }, []);

  return (
    <div className={styles.container} style={{ backgroundColor: colors.background, color: colors.text }}>
      {/* Header */}
      <div className={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <TaskListLtrRegular style={{ fontSize: "24px", color: colors.primary }} />
          <Text size={600} weight="bold">Zava Insurance — Claims Dashboard</Text>
        </div>
        <Button
          icon={isFullscreen ? <ArrowMinimizeRegular /> : <ArrowMaximizeRegular />}
          appearance="subtle"
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        />
      </div>

      {/* Metrics */}
      <div className={styles.metricsRow}>
        <div className={styles.metricCard} style={{ backgroundColor: colors.surface, borderLeft: `4px solid ${colors.primary}` }}>
          <Text size={400} style={{ color: colors.textSecondary }}>Total Claims</Text>
          <Text size={700} weight="bold" block>{metrics.total}</Text>
        </div>
        <div className={styles.metricCard} style={{ backgroundColor: colors.surface, borderLeft: `4px solid ${colors.success}` }}>
          <Text size={400} style={{ color: colors.textSecondary }}>Approved</Text>
          <Text size={700} weight="bold" block style={{ color: colors.success }}>{metrics.approved}</Text>
        </div>
        <div className={styles.metricCard} style={{ backgroundColor: colors.surface, borderLeft: `4px solid ${colors.warning}` }}>
          <Text size={400} style={{ color: colors.textSecondary }}>Pending</Text>
          <Text size={700} weight="bold" block style={{ color: colors.warning }}>{metrics.pending}</Text>
        </div>
        <div className={styles.metricCard} style={{ backgroundColor: colors.surface, borderLeft: `4px solid ${colors.error}` }}>
          <Text size={400} style={{ color: colors.textSecondary }}>Open</Text>
          <Text size={700} weight="bold" block style={{ color: colors.error }}>{metrics.open}</Text>
        </div>
        <div className={styles.metricCard} style={{ backgroundColor: colors.surface, borderLeft: `4px solid ${colors.info}` }}>
          <ReceiptMoneyRegular style={{ marginRight: "4px" }} />
          <Text size={400} style={{ color: colors.textSecondary }}>Total Est. Loss</Text>
          <Text size={700} weight="bold" block>${metrics.totalLoss.toLocaleString()}</Text>
        </div>
      </div>

      <Divider style={{ marginBottom: "12px" }} />

      {/* Filters */}
      <div className={styles.filters}>
        <Input
          placeholder="Search claims..."
          contentBefore={<SearchRegular />}
          value={search}
          onChange={(_, d) => setSearch(d.value)}
          style={{ flex: "1 1 200px" }}
        />
        <Select value={statusFilter} onChange={(_, d) => setStatusFilter(d.value)} style={{ minWidth: "150px" }}>
          <option value="all">All Statuses</option>
          {statuses.map(s => <option key={s} value={s.toLowerCase()}>{s}</option>)}
        </Select>
      </div>

      <Text size={300} style={{ color: colors.textSecondary, marginBottom: "8px", display: "block" }}>
        Showing {filtered.length} of {claims.length} claims
      </Text>

      {/* Claims Grid */}
      <div className={styles.grid}>
        {filtered.map(claim => (
          <Card
            key={claim.id}
            className={styles.claimCard}
            style={{ backgroundColor: colors.surface }}
            onClick={() => handleClaimClick(claim)}
          >
            <CardHeader
              header={
                <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                  <Text weight="semibold">{claim.claimNumber}</Text>
                  <Badge appearance="filled" color={getStatusColor(claim.status)} icon={getStatusIcon(claim.status)}>
                    {claim.status.split(" - ")[0]}
                  </Badge>
                </div>
              }
              description={
                <Text size={200} style={{ color: colors.textSecondary }}>
                  {claim.policyHolderName} · {claim.property}
                </Text>
              }
            />
            <div className={styles.cardRow}>
              <Text size={200} style={{ color: colors.textSecondary }}>
                Loss Date: {new Date(claim.dateOfLoss).toLocaleDateString()}
              </Text>
              <Text weight="semibold" style={{ color: colors.primary }}>
                ${claim.estimatedLoss.toLocaleString()}
              </Text>
            </div>
            <div className={styles.tags}>
              {claim.damageTypes.map((dt, i) => (
                <Badge key={i} appearance="outline" size="small">{dt}</Badge>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
