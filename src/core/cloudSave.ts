/**
 * Cloud save provider interface — stub only (no real backend).
 */
export interface CloudSaveProvider {
  upload(payload: string): Promise<{ revision: string }>;
  download(): Promise<{ payload: string; revision: string } | null>;
  getRevision(): Promise<string | null>;
  resolveConflict(local: string, remote: string): Promise<string>;
}

export class LocalCloudSaveStub implements CloudSaveProvider {
  private revision: string | null = null;
  private payload: string | null = null;

  async upload(payload: string) {
    this.payload = payload;
    this.revision = `local-${Date.now()}`;
    return { revision: this.revision };
  }

  async download() {
    if (!this.payload || !this.revision) return null;
    return { payload: this.payload, revision: this.revision };
  }

  async getRevision() {
    return this.revision;
  }

  async resolveConflict(local: string, _remote: string) {
    // Prefer local until real backend exists
    return local;
  }
}

export const cloudSaveStub = new LocalCloudSaveStub();
