import Link from "next/link";
import { revalidatePath } from "next/cache";

import { formatDateTimeLabel } from "../../features/training/model/format";
import { getSettingsPageDataForCurrentUser } from "../../features/training/server/getSettingsPageData";
import { resetLastUsedTrainingConfigForCurrentUser } from "../../features/training/server/lastUsedTrainingConfig";

export default async function SettingsPage() {
  const data = await getSettingsPageDataForCurrentUser();

  async function resetDistanceAction() {
    "use server";

    await resetLastUsedTrainingConfigForCurrentUser("distance");
    revalidatePath("/settings");
    revalidatePath("/train/distance");
  }

  async function resetKeyboardAction() {
    "use server";

    await resetLastUsedTrainingConfigForCurrentUser("keyboard");
    revalidatePath("/settings");
    revalidatePath("/train/keyboard");
  }

  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "40px 20px",
        display: "grid",
        gap: "16px",
      }}
    >
      <header style={{ display: "grid", gap: "8px" }}>
        <h1 style={{ margin: 0 }}>Settings</h1>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link href="/">Back home</Link>
          <Link href="/train/distance">Open distance train</Link>
          <Link href="/train/keyboard">Open keyboard train</Link>
        </div>
      </header>

      {data.isAuthenticated ? (
        <>
          <section
            style={{
              display: "grid",
              gap: "8px",
              padding: "16px",
              border: "1px solid #d4d4d8",
              borderRadius: "12px",
            }}
          >
            <div>
              <strong>Login status:</strong> signed in
            </div>
            <div>
              <strong>Name:</strong> {data.user?.name ?? "unknown"}
            </div>
            <div>
              <strong>Email:</strong> {data.user?.email ?? "unknown"}
            </div>
            <div>
              <strong>Last updated:</strong>{" "}
              {data.updatedAt ? formatDateTimeLabel(data.updatedAt) : "not saved yet"}
            </div>
          </section>

          <section
            style={{
              display: "grid",
              gap: "8px",
              padding: "16px",
              border: "1px solid #d4d4d8",
              borderRadius: "12px",
            }}
          >
            <h2 style={{ margin: 0 }}>Last-used distance config</h2>
            {data.lastDistanceConfig ? (
              <>
                <ConfigSnapshotView config={data.lastDistanceConfig} />
                <form action={resetDistanceAction}>
                  <button type="submit">Reset distance to defaults</button>
                </form>
              </>
            ) : (
              <>
                <div>No saved distance config yet.</div>
                <form action={resetDistanceAction}>
                  <button type="submit">Reset distance to defaults</button>
                </form>
              </>
            )}
          </section>

          <section
            style={{
              display: "grid",
              gap: "8px",
              padding: "16px",
              border: "1px solid #d4d4d8",
              borderRadius: "12px",
            }}
          >
            <h2 style={{ margin: 0 }}>Last-used keyboard config</h2>
            {data.lastKeyboardConfig ? (
              <>
                <ConfigSnapshotView config={data.lastKeyboardConfig} />
                <form action={resetKeyboardAction}>
                  <button type="submit">Reset keyboard to defaults</button>
                </form>
              </>
            ) : (
              <>
                <div>No saved keyboard config yet.</div>
                <form action={resetKeyboardAction}>
                  <button type="submit">Reset keyboard to defaults</button>
                </form>
              </>
            )}
          </section>
        </>
      ) : (
        <section
          style={{
            display: "grid",
            gap: "8px",
            padding: "16px",
            border: "1px solid #d4d4d8",
            borderRadius: "12px",
          }}
        >
          <div>
            You are using guest mode. Saved settings become available after sign-in.
          </div>
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
    <>
      <div>
        <strong>Mode:</strong> {config.mode}
      </div>
      <div>
        <strong>Interval range:</strong> {config.intervalRange.minSemitones} -{" "}
        {config.intervalRange.maxSemitones}
      </div>
      <div>
        <strong>Direction:</strong> {config.directionMode}
      </div>
      <div>
        <strong>Base note mode:</strong> {config.baseNoteMode}
      </div>
      <div>
        <strong>Fixed base note:</strong> {config.fixedBaseNote ?? "none"}
      </div>
      <div>
        <strong>Include unison:</strong> {config.includeUnison ? "yes" : "no"}
      </div>
      <div>
        <strong>Include octave:</strong> {config.includeOctave ? "yes" : "no"}
      </div>
      <div>
        <strong>End condition:</strong>{" "}
        {config.endCondition.type === "question_count"
          ? `question_count (${config.endCondition.questionCount})`
          : `time_limit (${config.endCondition.timeLimitMinutes} min)`}
      </div>
      {"intervalGranularity" in config && config.intervalGranularity ? (
        <div>
          <strong>Interval granularity:</strong> {config.intervalGranularity}
        </div>
      ) : null}
    </>
  );
}
