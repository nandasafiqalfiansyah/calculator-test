class PanelPropertiesType {
    constructor() {
        /**
         * @type {CLTLayerPropertiesType[]}
         */
        this.layers = [];
        this.EIeff = 0;          // Effective bending stiffness (N-mm²/m)
        this.method = '';        // 'shear-analogy' or 'gamma'
        this.totalThickness = 0; // mm
        this.layupName = '';
    }

    /**
     * Add layer properties
     * @param {CLTLayerPropertiesType} layerProp
     */
    addLayerProperties(layerProp) {
        this.layers.push(layerProp);
    }
}