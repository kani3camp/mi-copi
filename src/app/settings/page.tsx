import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";

import { formatDateTimeLabel } from "../../features/training/model/format";
import { getSettingsPageDataForCurrentUser } from "../../features/training/server/getSettingsPageData";
import { resetLastUsedTrainingConfigForCurrentUser } from "../../features/training/server/lastUsedTrainingConfig";
import {
  buttonStyle,
  cardStyle,
  keyValueCardStyle,
  keyValueGridStyle,
  navLinkStyle,
  navRowStyle,
  noticeStyle,
  pageHeroStyle,
  pageShellStyle,
  sectionTitleStyle,
  subtleTextStyle,
} from "../ui/polish";
import { GlobalSettingsSection } from "./global-settings-section";

interface SettingsPageProps {
  searchParams?: Promise<{
    reset?: string;
    error?: string;
  }>;
}

export default async function SettingsPage({
  searchParams,
}: SettingsPageProps) {
  const data = await getSettingsPageDataForCurrentUser();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const resetTarget = resolvedSearchParams?.reset;
  const resetError = resolvedSearchParams?.error;

  async function resetDistanceAction() {
    "use server";

    try {
      await resetLastUsedTrainingConfigForCurrentUser("distance");
      revalidatePath("/settings");
      revalidatePath("/train/distance");
    } catch {
      redirect("/settings?error=distance");
    }

    redirect("/settings?reset=distance");
  }

  async function resetKeyboardAction() {
    "use server";

    try {
      await resetLastUsedTrainingConfigForCurrentUser("keyboard");
      revalidatePath("/settings");
      revalidatePath("/train/keyboard");
    } catch {
      redirect("/settings?error=keyboard");
    }

    redirect("/settings?reset=keyboard");
  }

  return (
    <main style={pageShellStyle}>
      <header style={pageHeroStyle}>
        <h1 style={{ ...sectionTitleStyle, fontSize: "40px" }}>Settings</h1>
        <p style={subtleTextStyle}>
          グローバル設定の変更と、保存済み last-used config の確認 /
          リセットを行えます。
        </p>
        <div style={navRowStyle}>
          <Link href="/" style={navLinkStyle}>
            Back home
          </Link>
          <Link href="/train/distance" style={navLinkStyle}>
            Open distance train
          </Link>
          <Link href="/train/keyboard" style={navLinkStyle}>
            Open keyboard train
          </Link>
        </div>
      </header>

      {resetTarget ? (
        <section style={noticeStyle("success")}>
          {resetTarget === "distance"
            ? "Distance config was reset to defaults."
            : "Keyboard config was reset to defaults."}
        </section>
      ) : null}

      {resetError ? (
        <section style={noticeStyle("error")}>
          {resetError === "distance"
            ? "Failed to reset distance config. Please try again."
            : "Failed to reset keyboard config. Please try again."}
        </section>
      ) : null}

      <GlobalSettingsSection />

      {data.isAuthenticated ? (
        <>
          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>Account overview</h2>
            <div style={keyValueGridStyle}>
              <div style={keyValueCardStyle}>
                <strong>Login status</strong>
                <span>signed in</span>
              </div>
              <div style={keyValueCardStyle}>
                <strong>Name</strong>
                <span>{data.user?.name ?? "unknown"}</span>
              </div>
              <div style={keyValueCardStyle}>
                <strong>Email</strong>
                <span>{data.user?.email ?? "unknown"}</span>
              </div>
              <div style={keyValueCardStyle}>
                <strong>Last updated</strong>
                <span>
                  {data.updatedAt
                    ? formatDateTimeLabel(data.updatedAt)
                    : "not saved yet"}
                </span>
              </div>
            </div>
          </section>

          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>Last-used distance config</h2>
            {data.lastDistanceConfig ? (
              <>
                <ConfigSnapshotView config={data.lastDistanceConfig} />
                <form action={resetDistanceAction}>
                  <button type="submit" style={buttonStyle()}>
                    Reset distance to defaults
                  </button>
                </form>
              </>
            ) : (
              <>
                <p style={subtleTextStyle}>No saved distance config yet.</p>
                <form action={resetDistanceAction}>
                  <button type="submit" style={buttonStyle()}>
                    Reset distance to defaults
                  </button>
                </form>
              </>
            )}
          </section>

          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>Last-used keyboard config</h2>
            {data.lastKeyboardConfig ? (
              <>
                <ConfigSnapshotView config={data.lastKeyboardConfig} />
                <form action={resetKeyboardAction}>
                  <button type="submit" style={buttonStyle()}>
                    Reset keyboard to defaults
                  </button>
                </form>
              </>
            ) : (
              <>
                <p style={subtleTextStyle}>No saved keyboard config yet.</p>
                <form action={resetKeyboardAction}>
                  <button type="submit" style={buttonStyle()}>
                    Reset keyboard to defaults
                  </button>
                </form>
              </>
            )}
          </section>
        </>
      ) : (
        <section style={cardStyle}>
          <p style={subtleTextStyle}>
            You are using guest mode. Saved settings become available after
            sign-in.
          </p>
        </section>
      )}
    </main>
  );
}

function ConfigSnapshotView(props: {
  config: {
    mode: "distance" | "keyboard";
    intervalRange: {
      minSemitones: number;
      maxSemitones: number;
    };
    directionMode: "up_only" | "mixed";
    includeUnison: boolean;
    includeOctave: boolean;
    baseNoteMode: "fixed" | "random";
    fixedBaseNote: string | null;
    endCondition:
      | {
          type: "question_count";
          questionCount: number;
        }
      | {
          type: "time_limit";
          timeLimitMinutes: number;
        };
    intervalGranularity?: "simple" | "aug_dim";
  };
}) {
  const { config } = props;

  return (
    <div style={keyValueGridStyle}>
      <div style={keyValueCardStyle}>
        <strong>Mode:</strong> {config.mode}
      </div>
      <div style={keyValueCardStyle}>
        <strong>Interval range:</strong> {config.intervalRange.minSemitones} -{" "}
        {config.intervalRange.maxSemitones}
      </div>
      <div style={keyValueCardStyle}>
        <strong>Direction:</strong> {config.directionMode}
      </div>
      <div style={keyValueCardStyle}>
        <strong>Base note mode:</strong> {config.baseNoteMode}
      </div>
      <div style={keyValueCardStyle}>
        <strong>Fixed base note:</strong> {config.fixedBaseNote ?? "none"}
      </div>
      <div style={keyValueCardStyle}>
        <strong>Include unison:</strong> {config.includeUnison ? "yes" : "no"}
      </div>
      <div style={keyValueCardStyle}>
        <strong>Include octave:</strong> {config.includeOctave ? "yes" : "no"}
      </div>
      <div style={keyValueCardStyle}>
        <strong>End condition:</strong>{" "}
        {config.endCondition.type === "question_count"
          ? `question_count (${config.endCondition.questionCount})`
          : `time_limit (${config.endCondition.timeLimitMinutes} min)`}
      </div>
      {"intervalGranularity" in config && config.intervalGranularity ? (
        <div style={keyValueCardStyle}>
          <strong>Interval granularity:</strong> {config.intervalGranularity}
        </div>
      ) : null}
    </div>
  );
}
