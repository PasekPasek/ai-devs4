import { config } from './config';
import { retry } from './utils';

export async function check_package(args: { packageid: string }): Promise<string> {
  console.log(`[TOOL] check_package(${args.packageid})`);

  const response = await retry(async () => {
    const res = await fetch(config.PACKAGE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apikey: config.HUB_AGENTS_TOKEN,
        action: 'check',
        packageid: args.packageid
      })
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }

    return res.json();
  });

  console.log(`[TOOL] check_package(${args.packageid}) →`, JSON.stringify(response));
  return JSON.stringify({ success: true, package: response });
}

export async function redirect_package(args: {
  packageid: string;
  destination: string;
  code: string
}): Promise<string> {
  console.log(`[TOOL] redirect_package(${args.packageid} → ${args.destination}, code: ${args.code})`);

  const response = await retry(async () => {
    const res = await fetch(config.PACKAGE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apikey: config.HUB_AGENTS_TOKEN,
        action: 'redirect',
        packageid: args.packageid,
        destination: args.destination,
        code: args.code
      })
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }

    return res.json();
  });

  console.log(`[TOOL] redirect_package result →`, JSON.stringify(response));
  return JSON.stringify({ success: true, result: response });
}

export const toolHandlers: Record<string, (args: any) => Promise<string>> = {
  check_package,
  redirect_package
};
