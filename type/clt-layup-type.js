class CLTLayupType {
    /**
     * @param {string} name - Name of the CLT layup
     * @param {number} beff - Effective width in mm (default: 1000)
     */
    constructor(name, beff = 1000) {
        this.name = name;
        this.beff = beff;  // mm - effective width
        /**
         * @type {CLTLayerType[]}
         */
        this.layers = [];

        // Analytical method: 'shear-analogy' or 'gamma'
        this.analyticalMethod = 'shear-analogy';
    }

    /**
     * Add a layer to the layup
     * @param {CLTLayerType} layer
     */
    addLayer(layer) {
        this.layers.push(layer);
    }

    /**
     * Get all layers
     * @returns {CLTLayerType[]}
     */
    getLayers() {
        return this.layers;
    }

    /**
     * Get total thickness
     * @returns {number}
     */
    getTotalThickness() {
        return this.layers.reduce((sum, layer) => sum + layer.thickness, 0);
    }

    /**
     * Check if layup is symmetric from top to bottom (for Shear Analogy)
     * @returns {boolean}
     */
    isSymmetric() {
        const n = this.layers.length;
        for (let i = 0; i < Math.floor(n / 2); i++) {
            const top = this.layers[i];
            const bottom = this.layers[n - 1 - i];
            if (top.thickness !== bottom.thickness || top.orientation !== bottom.orientation) {
                return false;
            }
        }
        return true;
    }

    /**
     * Validate the layup for the selected analytical method
     * @returns {{ valid: boolean, message: string }}
     */
    validate() {
        const n = this.layers.length;

        if (this.analyticalMethod === 'shear-analogy') {
            if (n < 3 || n > 9) {
                return { valid: false, message: `Shear Analogy requires 3-9 layers. Current: ${n} layers.` };
            }
            if (!this.isSymmetric()) {
                return { valid: false, message: 'Shear Analogy requires symmetric layup from top to bottom (thickness and orientation must match symmetrically).' };
            }
        } else if (this.analyticalMethod === 'gamma') {
            if (n !== 3 && n !== 5) {
                return { valid: false, message: `Gamma method only supports 3 or 5 layers. Current: ${n} layers.` };
            }
        }

        return { valid: true, message: '' };
    }
}