// home-portal(SSOの発行元)の/api/auth/sessionをその場で叩いて、このアカウントが
// "tasks"アプリを利用してよいか判定する。
//
// 許可アプリ一覧(allowedApps)はJWT Cookieには埋め込んでいない。もし埋め込むと、
// todoappはJWTをローカルデコードするだけの構成のため、home-portal側で管理画面から
// 権限を剥奪してもJWTが再発行されるまで反映されない(長ければ数十日)事故になる。
// そのため認可判定だけは必ずhome-portalのDBを都度参照するこのエンドポイント経由で行う
// (news/shiny-broccoli/ai-factory-webのSSOセッション確認と同じ発想)。
const SSO_SESSION_URL = process.env.SSO_SESSION_URL ?? "http://home-portal-web:3100/api/auth/session";
const APP_KEY = "tasks";

interface SsoSession {
  user?: {
    email?: string;
    allowedApps?: string[];
  };
}

export async function checkAppAccess(cookieHeader: string): Promise<boolean> {
  try {
    const res = await fetch(SSO_SESSION_URL, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
    if (!res.ok) return false;

    const data: SsoSession = await res.json();
    if (!data?.user?.email) return false;

    const allowedApps = data.user.allowedApps ?? [];
    return allowedApps.length === 0 || allowedApps.includes(APP_KEY);
  } catch {
    return false;
  }
}
