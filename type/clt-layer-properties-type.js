class CLTLayerPropertiesType {
    /**
     * @param {CLTLayerType} layer - The original layer data
     * @param {number} y - Distance from bottom to layer center (mm)
     * @param {number} a - Distance from neutral axis to layer center (mm)
     * @param {number} beff_ti3_12 - Local bending stiffness beff·ti³/12 (mm⁴)
     * @param {number} beff_ti_ai2 - Steiner term beff·ti·ai² (mm⁴)
     * @param {number} gamma - Gamma factor (1 for Shear Analogy, calculated for Gamma method)
     * @param {number} EI - Effective bending stiffness for this layer (N-mm²/m)
     */
    constructor(layer, y, a, beff_ti3_12, beff_ti_ai2, gamma, EI) {
        this.layerIndex = layer.id;
        this.thickness = layer.thickness;
        this.orientation = layer.orientation;
        this.E = layer.E;
        this.G = layer.G;
        this.y = y;
        this.a = a;
        this.beff_ti3_12 = beff_ti3_12;
        this.beff_ti_ai2 = beff_ti_ai2;
        this.gamma = gamma;
        this.EI = EI;
    }
}