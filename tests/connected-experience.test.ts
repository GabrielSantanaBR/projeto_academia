import { describe, expect, it } from "vitest";
import { InputError } from "@/lib/action-result";
import { metersBetween, paceLabel, validateRun } from "@/lib/running";
import { videoEmbedUrl } from "@/lib/video";

describe("exercise media", () => {
  it("accepts only known hosts, HTTPS and exact video identifiers", () => {
    expect(videoEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(videoEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(videoEmbedUrl("https://vimeo.com/12345678")).toBe("https://player.vimeo.com/video/12345678");
    for (const url of ["javascript:alert(1)","http://youtu.be/dQw4w9WgXcQ","https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ", "https://youtube.com/watch?v=x", "https://admin@youtube.com/watch?v=dQw4w9WgXcQ"]) expect(videoEmbedUrl(url)).toBeNull();
  });
});

describe("private running route", () => {
  const now = new Date("2026-09-23T12:00:30.000Z");
  const first = { lat: -23.55, lng: -46.63, t: now.getTime() - 20_000, segment: 0 };
  const second = { lat: -23.5495, lng: -46.63, t: now.getTime() - 8_000, segment: 0 };
  it("derives distance on the server and skips paused intervals", () => {
    const meters = metersBetween(first, second);
    expect(meters).toBeGreaterThan(50);
    expect(validateRun([first, second], 25, new Date(now.getTime()-30_000), now)).toBe(Math.round(meters));
    expect(() => validateRun([first, {...second, segment: 1}], 25, new Date(now.getTime()-30_000), now)).toThrow(InputError);
    expect(paceLabel(5000,1500)).toBe("5:00 /km");
  });
  it("rejects forged timestamps and unreasonably fast jumps", () => {
    expect(() => validateRun([second,first],25,new Date(now.getTime()-30_000),now)).toThrow(InputError);
    expect(() => validateRun([first,second],70,new Date(now.getTime()-30_000),now)).toThrow(InputError);
    expect(() => validateRun([first,{...second,lat:-22}],25,new Date(now.getTime()-30_000),now)).toThrow(InputError);
  });
});
