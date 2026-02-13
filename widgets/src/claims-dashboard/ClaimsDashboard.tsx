import React, { useState, useCallback, useMemo, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import {
  makeStyles,
  Text,
  Badge,
  tokens,
} from "@fluentui/react-components";
import {
  TaskListLtrRegular,
  ArrowLeftRegular,
  ArrowRightRegular,
  CheckmarkCircleRegular,
  DismissCircleRegular,
  ClockRegular,
  AlertRegular,
  DocumentRegular,
  ReceiptMoneyRegular,
  ArrowMaximizeRegular,
} from "@fluentui/react-icons";
import { useOpenAiGlobal } from "../hooks/useOpenAiGlobal";
import { useThemeColors } from "../hooks/useThemeColors";
import type { ClaimsDashboardData, Claim } from "../types";

/* ─── styles ──────────────────────────────────────────────────────────── */
const useStyles = makeStyles({
  root: {
    fontFamily: tokens.fontFamilyBase,
    position: "relative",
    width: "100%",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "20px 20px 0",
  },
  headerIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "44px",
    height: "44px",
    borderRadius: "14px",
    flexShrink: 0,
  },
  metricsStrip: {
    display: "flex",
    gap: "16px",
    padding: "16px 20px 4px",
    flexWrap: "wrap" as const,
  },
  metric: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  viewport: {
    overflow: "hidden",
    padding: "16px 0",
  },
  slideContainer: {
    display: "flex",
    gap: "16px",
    paddingLeft: "20px",
    paddingRight: "20px",
  },
  card: {
    minWidth: "280px",
    maxWidth: "280px",
    width: "70vw",
    display: "flex",
    flexDirection: "column" as const,
    borderRadius: "16px",
    overflow: "hidden",
    cursor: "pointer",
    transition: "transform 0.15s, box-shadow 0.15s",
    flexShrink: 0,
    ":hover": {
      transform: "translateY(-2px)",
    },
  },
  cardTop: {
    padding: "16px 16px 12px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
    flex: 1,
  },
  cardTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  damageRow: {
    display: "flex",
    gap: "4px",
    flexWrap: "wrap" as const,
    marginTop: "4px",
  },
  cardBottom: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 16px",
    borderTop: "1px solid",
  },
  navBtn: {
    position: "absolute" as const,
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 10,
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "background 0.15s",
  },
  edgeFade: {
    position: "absolute" as const,
    top: 0,
    bottom: 0,
    width: "12px",
    pointerEvents: "none" as const,
    zIndex: 5,
    transition: "opacity 0.2s",
  },
});

/* ─── status helpers ──────────────────────────────────────────────────── */
function statusColor(s: string): "success" | "warning" | "danger" | "informative" | "important" {
  const l = s.toLowerCase();
  if (l.includes("approved")) return "success";
  if (l.includes("pending")) return "warning";
  if (l.includes("denied") || l.includes("rejected")) return "danger";
  if (l.includes("closed")) return "informative";
  return "important";
}

function statusIcon(s: string) {
  const l = s.toLowerCase();
  if (l.includes("approved")) return <CheckmarkCircleRegular />;
  if (l.includes("pending")) return <ClockRegular />;
  if (l.includes("denied")) return <DismissCircleRegular />;
  if (l.includes("closed")) return <DocumentRegular />;
  return <AlertRegular />;
}

/* ─── claim card ──────────────────────────────────────────────────────── */
function ClaimCard({
  claim,
  colors,
  styles,
  onClick,
}: {
  claim: Claim;
  colors: ReturnType<typeof useThemeColors>;
  styles: ReturnType<typeof useStyles>;
  onClick: () => void;
}) {
  return (
    <div
      className={styles.card}
      style={{
        backgroundColor: colors.surface,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}
      onClick={onClick}
    >
      <div className={styles.cardTop}>
        <div className={styles.cardTopRow}>
          <Text weight="semibold" size={400}>
            {claim.claimNumber}
          </Text>
          <Badge
            appearance="filled"
            color={statusColor(claim.status)}
            icon={statusIcon(claim.status)}
            size="small"
          >
            {claim.status.split(" - ")[0]}
          </Badge>
        </div>

        <div>
          <Text size={300} weight="semibold" style={{ display: "block" }}>
            {claim.policyHolderName}
          </Text>
          <Text size={200} style={{ color: colors.textSecondary }}>
            {claim.property}
          </Text>
        </div>

        <Text size={200} style={{ color: colors.textSecondary }}>
          {claim.description.length > 100
            ? claim.description.slice(0, 100) + "…"
            : claim.description}
        </Text>

        <div className={styles.damageRow}>
          {claim.damageTypes.map((dt, i) => (
            <Badge key={i} appearance="outline" size="small">
              {dt}
            </Badge>
          ))}
        </div>
      </div>

      <div className={styles.cardBottom} style={{ borderColor: colors.border }}>
        <Text size={200} style={{ color: colors.textSecondary }}>
          {new Date(claim.dateOfLoss).toLocaleDateString()}
        </Text>
        <Text weight="semibold" style={{ color: colors.primary }}>
          ${claim.estimatedLoss.toLocaleString()}
        </Text>
      </div>
    </div>
  );
}

/* ─── sample data ─────────────────────────────────────────────────────── */
const SAMPLE_CLAIMS: Claim[] = [
  {
    id: "1",
    claimNumber: "CN202504990",
    policyNumber: "POL-HO-2025-001",
    policyHolderName: "Sample User",
    policyHolderEmail: "sample@email.com",
    property: "123 Main St",
    dateOfLoss: "2025-01-01",
    dateReported: "2025-01-02",
    status: "Open - Under Investigation",
    damageTypes: ["Fire damage"],
    description: "Sample claim",
    estimatedLoss: 25000,
    adjusterAssigned: "adj-001",
    notes: [],
    createdAt: "2025-01-02",
    updatedAt: "2025-01-03",
  },
];

/* ─── main component ──────────────────────────────────────────────────── */
export function ClaimsDashboard() {
  const styles = useStyles();
  const colors = useThemeColors();
  const toolOutput = useOpenAiGlobal("toolOutput") as ClaimsDashboardData | null;
  const claims = toolOutput?.claims ?? SAMPLE_CLAIMS;

  // Embla carousel setup — same pattern as the official pizzaz-carousel
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
    containScroll: "trimSnaps",
    slidesToScroll: "auto",
    dragFree: true,
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  useEffect(() => {
    if (!emblaApi) return;
    const update = () => {
      setCanPrev(emblaApi.canScrollPrev());
      setCanNext(emblaApi.canScrollNext());
    };
    update();
    emblaApi.on("select", update);
    emblaApi.on("reInit", update);
    return () => {
      emblaApi.off("select", update);
      emblaApi.off("reInit", update);
    };
  }, [emblaApi]);

  // Metrics summary
  const metrics = useMemo(() => {
    const total = claims.length;
    const totalLoss = claims.reduce((s, c) => s + c.estimatedLoss, 0);
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

  const handleFullscreen = useCallback(async () => {
    if (window.openai?.requestDisplayMode) {
      await window.openai.requestDisplayMode({ mode: "fullscreen" });
    }
  }, []);

  return (
    <div
      className={styles.root}
      style={{ backgroundColor: colors.background, color: colors.text }}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div
          className={styles.headerIcon}
          style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}
        >
          <TaskListLtrRegular style={{ fontSize: "22px" }} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <Text size={500} weight="bold" style={{ display: "block" }}>
            Zava Insurance — Claims
          </Text>
          <Text size={200} style={{ color: colors.textSecondary }}>
            {claims.length} claims · ${metrics.totalLoss.toLocaleString()} estimated loss
          </Text>
        </div>
        <button
          onClick={handleFullscreen}
          title="Fullscreen"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: colors.textSecondary,
            padding: "6px",
          }}
        >
          <ArrowMaximizeRegular style={{ fontSize: "18px" }} />
        </button>
      </div>

      {/* ── Metric pills ───────────────────────────────────────────── */}
      <div className={styles.metricsStrip}>
        {[
          { label: "Open", value: metrics.open, color: colors.error },
          { label: "Pending", value: metrics.pending, color: colors.warning },
          { label: "Approved", value: metrics.approved, color: colors.success },
        ].map(m => (
          <div key={m.label} className={styles.metric}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: m.color,
                display: "inline-block",
              }}
            />
            <Text size={200} style={{ color: colors.textSecondary }}>
              {m.value} {m.label}
            </Text>
          </div>
        ))}
        <div className={styles.metric}>
          <ReceiptMoneyRegular style={{ fontSize: "14px", color: colors.textSecondary }} />
          <Text size={200} style={{ color: colors.textSecondary }}>
            ${metrics.totalLoss.toLocaleString()}
          </Text>
        </div>
      </div>

      {/* ── Carousel ───────────────────────────────────────────────── */}
      <div className={styles.viewport} ref={emblaRef}>
        <div className={styles.slideContainer}>
          {claims.map(claim => (
            <ClaimCard
              key={claim.id}
              claim={claim}
              colors={colors}
              styles={styles}
              onClick={() => handleClaimClick(claim)}
            />
          ))}
        </div>
      </div>

      {/* ── Edge gradients ─────────────────────────────────────────── */}
      <div
        className={styles.edgeFade}
        style={{
          left: 0,
          opacity: canPrev ? 1 : 0,
          borderLeft: "1px solid rgba(0,0,0,0.1)",
          background: "linear-gradient(to right, rgba(0,0,0,0.06), transparent)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, white 30%, white 70%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, white 30%, white 70%, transparent 100%)",
        }}
      />
      <div
        className={styles.edgeFade}
        style={{
          right: 0,
          opacity: canNext ? 1 : 0,
          borderRight: "1px solid rgba(0,0,0,0.1)",
          background: "linear-gradient(to left, rgba(0,0,0,0.06), transparent)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, white 30%, white 70%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, white 30%, white 70%, transparent 100%)",
        }}
      />

      {/* ── Arrow buttons ──────────────────────────────────────────── */}
      {canPrev && (
        <button
          aria-label="Previous"
          className={styles.navBtn}
          style={{
            left: 8,
            backgroundColor: colors.surface,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            color: colors.text,
          }}
          onClick={() => emblaApi?.scrollPrev()}
        >
          <ArrowLeftRegular style={{ fontSize: "18px" }} />
        </button>
      )}
      {canNext && (
        <button
          aria-label="Next"
          className={styles.navBtn}
          style={{
            right: 8,
            backgroundColor: colors.surface,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            color: colors.text,
          }}
          onClick={() => emblaApi?.scrollNext()}
        >
          <ArrowRightRegular style={{ fontSize: "18px" }} />
        </button>
      )}
    </div>
  );
}
