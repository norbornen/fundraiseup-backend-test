export interface ISyncUsecase {
  run(): Promise<void>;
  destroy(): Promise<void>;
}
