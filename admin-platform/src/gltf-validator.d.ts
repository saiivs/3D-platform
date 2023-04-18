declare module 'gltf-validator' {
    function gltfValidator(file: File, options?: { externalResourceFunction?: (uri: string) => Promise<{ uri: string, response: Response }> }): Promise<any>;
    export { gltfValidator };
  }