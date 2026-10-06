import { describe, expect, it } from "vitest";
import { clientIpFromHeaders } from "./client-ip";

describe("clientIpFromHeaders", () => {
  it("mengabaikan header jika tidak ada proxy tepercaya", () => {
    expect(clientIpFromHeaders("1.2.3.4", "1.2.3.4", 0)).toBeNull();
  });

  it("satu proxy: memakai entri paling kanan, bukan yang diisi klien", () => {
    // Klien memalsukan "9.9.9.9"; proxy menambahkan IP asli 203.0.113.7 di kanan.
    expect(clientIpFromHeaders("9.9.9.9, 203.0.113.7", null, 1)).toBe("203.0.113.7");
  });

  it("dua proxy: memakai entri ke-2 dari kanan", () => {
    expect(clientIpFromHeaders("9.9.9.9, 203.0.113.7, 10.0.0.2", null, 2)).toBe("203.0.113.7");
  });

  it("rantai lebih pendek dari jumlah proxy: tidak menebak", () => {
    expect(clientIpFromHeaders("203.0.113.7", null, 2)).toBeNull();
  });

  it("tanpa X-Forwarded-For: jatuh ke X-Real-IP", () => {
    expect(clientIpFromHeaders(null, "198.51.100.4", 1)).toBe("198.51.100.4");
  });

  it("menolak nilai yang bukan alamat IP", () => {
    expect(clientIpFromHeaders("<script>", null, 1)).toBeNull();
  });

  it("mendukung IPv6", () => {
    expect(clientIpFromHeaders("2001:db8::1", null, 1)).toBe("2001:db8::1");
  });
});
