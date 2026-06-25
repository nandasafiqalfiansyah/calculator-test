/**
 * Calculator Application Controller
 * Manages the UI and coordinates data types with calculations
 */
class CalculatorApp {
    constructor() {
        this.layup = new CLTLayupType('CLT Panel', 1000);
        this.initDOM();
        this.initEventListeners();
        this.renderLayers();
    }

    initDOM() {
        this.layupNameInput = document.getElementById('layupName');
        this.beffInput = document.getElementById('beff');
        this.materialGradeSelect = document.getElementById('materialGrade');
        this.analyticalMethodSelect = document.getElementById('analyticalMethod');
        this.numLayersInput = document.getElementById('numLayers');
        this.applyLayersBtn = document.getElementById('applyLayersBtn');
        this.layerContainer = document.getElementById('layerContainer');
        this.calculateBtn = document.getElementById('calculateBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.layerCountBadge = document.getElementById('layerCount');
        this.layerValidation = document.getElementById('layerValidation');

        // Results
        this.resultsContainer = document.getElementById('resultsContainer');
        this.validationAlert = document.getElementById('validationAlert');
        this.resultContent = document.getElementById('resultContent');
        this.eiEffResult = document.getElementById('eiEffResult');
        this.methodResult = document.getElementById('methodResult');
        this.thicknessResult = document.getElementById('thicknessResult');
        this.shearAnalogySection = document.getElementById('shearAnalogySection');
        this.gammaSection = document.getElementById('gammaSection');
        this.shearAnalogyTableBody = document.getElementById('shearAnalogyTableBody');
        this.gammaTableBody = document.getElementById('gammaTableBody');
        this.shearAnalogyTotalEI = document.getElementById('shearAnalogyTotalEI');
        this.gammaTotalEI = document.getElementById('gammaTotalEI');
    }

    initEventListeners() {
        this.applyLayersBtn.addEventListener('click', () => this.applyLayerCount());
        this.numLayersInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.applyLayerCount();
        });
        this.calculateBtn.addEventListener('click', () => this.calculate());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.analyticalMethodSelect.addEventListener('change', () => {
            this.layup.analyticalMethod = this.analyticalMethodSelect.value;
            this.updateMethodLabels();
        });
        this.layupNameInput.addEventListener('input', () => {
            this.layup.name = this.layupNameInput.value;
        });
        this.beffInput.addEventListener('input', () => {
            this.layup.beff = parseFloat(this.beffInput.value) || 1000;
        });
    }

    getMaterialGrade() {
        const name = this.materialGradeSelect.value;
        switch (name) {
            case 'MGP10': return MaterialGrade.MGP10;
            case 'MGP12': return MaterialGrade.MGP12;
            default: return MaterialGrade.MGP10;
        }
    }

    applyLayerCount() {
        const count = parseInt(this.numLayersInput.value);
        if (isNaN(count) || count < 3 || count > 9) {
            this.layerValidation.textContent = 'Number of layers must be between 3 and 9.';
            return;
        }

        const method = this.analyticalMethodSelect.value;
        if (method === 'gamma' && count !== 3 && count !== 5) {
            this.layerValidation.textContent = 'Gamma method only supports 3 or 5 layers.';
            return;
        }

        this.layerValidation.textContent = '';
        this.layup = new CLTLayupType(this.layupNameInput.value, parseFloat(this.beffInput.value) || 1000);
        this.layup.analyticalMethod = this.analyticalMethodSelect.value;

        const material = this.getMaterialGrade();
        for (let i = 0; i < count; i++) {
            // Default alternating orientation: start with 0°, then alternate
            const orientation = (i % 2 === 0) ? 0 : 90;
            const layer = new CLTLayerType(35, orientation, material);
            this.layup.addLayer(layer);
        }

        this.renderLayers();
        this.updateLayerCount();
        this.hideResults();
    }

    renderLayers() {
        const layers = this.layup.getLayers();
        if (layers.length === 0) {
            this.layerContainer.innerHTML = `
                <div class="text-center text-muted py-3">
                    <p class="mb-0">No layers configured. Click "Apply" to generate layers.</p>
                </div>
            `;
            return;
        }

        // Check if symmetric (for visual indicator)
        const isSymmetric = this.layup.isSymmetric();

        let html = '';
        const layerNames = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9'];
        layers.forEach((layer, index) => {
            html += `
                <div class="layer-row" data-layer-index="${index}">
                    <div class="row align-items-center">
                        <div class="col-md-2">
                            <strong>${layerNames[index] || 'Layer ' + (index + 1)}</strong>
                            <small class="text-muted d-block">#${index + 1}</small>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label small">Thickness (mm)</label>
                            <input type="number" class="form-control form-control-sm layer-thickness" 
                                   value="${layer.thickness}" min="1" max="200" step="0.1">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label small">Orientation (°)</label>
                            <select class="form-select form-select-sm layer-orientation">
                                <option value="0" ${layer.orientation === 0 ? 'selected' : ''}>0° (Parallel)</option>
                                <option value="90" ${layer.orientation === 90 ? 'selected' : ''}>90° (Perpendicular)</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label small">Material</label>
                            <select class="form-select form-select-sm layer-material">
                                <option value="MGP10" ${layer.materialGrade.name === 'MGP10' ? 'selected' : ''}>MGP10</option>
                                <option value="MGP12" ${layer.materialGrade.name === 'MGP12' ? 'selected' : ''}>MGP12</option>
                            </select>
                        </div>
                        <div class="col-md-1 d-flex align-items-end">
                            <button class="btn btn-outline-danger btn-sm remove-btn" data-index="${index}">
                                ✕
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        if (!isSymmetric && this.analyticalMethodSelect.value === 'shear-analogy') {
            html += `
                <div class="alert alert-warning mt-2 mb-0 py-2">
                    <small>⚠️ Layup is not symmetric. Shear Analogy requires symmetric layup from top to bottom.</small>
                </div>
            `;
        }

        this.layerContainer.innerHTML = html;

        // Attach event listeners to layer inputs
        document.querySelectorAll('.layer-thickness').forEach((input, index) => {
            input.addEventListener('change', (e) => {
                this.layup.layers[index].thickness = parseFloat(e.target.value) || 35;
                this.renderLayers();
                this.hideResults();
            });
        });

        document.querySelectorAll('.layer-orientation').forEach((select, index) => {
            select.addEventListener('change', (e) => {
                this.layup.layers[index].orientation = parseInt(e.target.value);
                this.renderLayers();
                this.hideResults();
            });
        });

        document.querySelectorAll('.layer-material').forEach((select, index) => {
            select.addEventListener('change', (e) => {
                const gradeName = e.target.value;
                this.layup.layers[index].materialGrade = gradeName === 'MGP10' ? MaterialGrade.MGP10 : MaterialGrade.MGP12;
                this.renderLayers();
                this.hideResults();
            });
        });

        document.querySelectorAll('.remove-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.layup.layers.splice(index, 1);
                this.numLayersInput.value = this.layup.layers.length;
                this.renderLayers();
                this.updateLayerCount();
                this.hideResults();
            });
        });
    }

    updateLayerCount() {
        const count = this.layup.getLayers().length;
        this.layerCountBadge.textContent = `${count} Layers`;
        this.numLayersInput.value = count;
    }

    updateMethodLabels() {
        const method = this.analyticalMethodSelect.value;
        const isGamma = method === 'gamma';
        
        // Update layer count constraints
        if (isGamma) {
            this.numLayersInput.max = 5;
            if (parseInt(this.numLayersInput.value) > 5) {
                this.numLayersInput.value = 5;
            }
            if (parseInt(this.numLayersInput.value) !== 3 && parseInt(this.numLayersInput.value) !== 5) {
                this.layerValidation.textContent = 'Gamma method only supports 3 or 5 layers.';
            } else {
                this.layerValidation.textContent = '';
            }
        } else {
            this.numLayersInput.max = 9;
            this.layerValidation.textContent = '';
        }
    }

    calculate() {
        // Update layup from inputs
        this.layup.name = this.layupNameInput.value;
        this.layup.beff = parseFloat(this.beffInput.value) || 1000;
        this.layup.analyticalMethod = this.analyticalMethodSelect.value;

        // Validate
        const validation = this.layup.validate();
        if (!validation.valid) {
            this.validationAlert.textContent = validation.message;
            this.validationAlert.classList.remove('d-none');
            this.resultContent.classList.add('d-none');
            return;
        }

        this.validationAlert.classList.add('d-none');

        // Calculate
        const calculator = PanelProperties.getCalculator(this.layup.analyticalMethod);
        const result = calculator.calculate(this.layup);

        // Display results
        this.displayResults(result);
    }

    displayResults(result) {
        this.resultContent.classList.remove('d-none');

        // Summary
        this.eiEffResult.textContent = result.EIeff.toLocaleString('en-US', { maximumFractionDigits: 2 });
        this.methodResult.textContent = result.method === 'shear-analogy' ? 'Shear Analogy' : 'Gamma Method';
        this.thicknessResult.textContent = result.totalThickness.toFixed(1);

        // Show/hide sections
        if (result.method === 'shear-analogy') {
            this.shearAnalogySection.classList.remove('hidden-section');
            this.gammaSection.classList.add('hidden-section');
            this.renderShearAnalogyTable(result);
        } else {
            this.gammaSection.classList.remove('hidden-section');
            this.shearAnalogySection.classList.add('hidden-section');
            this.renderGammaTable(result);
        }

        // Scroll to results
        this.resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    renderShearAnalogyTable(result) {
        let html = '';
        const layerNames = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9'];

        result.layers.forEach((layer, index) => {
            html += `
                <tr>
                    <td><strong>${layerNames[index] || 'Layer ' + (index + 1)}</strong></td>
                    <td>${layer.thickness.toFixed(1)}</td>
                    <td>${layer.orientation}°</td>
                    <td>${layer.E.toFixed(1)}</td>
                    <td>${layer.G.toFixed(1)}</td>
                    <td>${layer.y.toFixed(2)}</td>
                    <td>${layer.a.toFixed(2)}</td>
                    <td>${layer.beff_ti3_12.toFixed(2)}</td>
                    <td>${layer.beff_ti_ai2.toFixed(2)}</td>
                    <td class="result-value">${layer.EI.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                </tr>
            `;
        });

        this.shearAnalogyTableBody.innerHTML = html;
        this.shearAnalogyTotalEI.textContent = result.EIeff.toLocaleString('en-US', { maximumFractionDigits: 2 });
    }

    renderGammaTable(result) {
        let html = '';
        const layerNames = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9'];

        result.layers.forEach((layer, index) => {
            const gammaBeffTiAi2 = layer.gamma * layer.beff_ti_ai2;
            html += `
                <tr>
                    <td><strong>${layerNames[index] || 'Layer ' + (index + 1)}</strong></td>
                    <td>${layer.thickness.toFixed(1)}</td>
                    <td>${layer.orientation}°</td>
                    <td>${layer.E.toFixed(1)}</td>
                    <td>${layer.G.toFixed(1)}</td>
                    <td class="result-value">${layer.gamma.toFixed(6)}</td>
                    <td>${layer.a.toFixed(2)}</td>
                    <td>${layer.beff_ti3_12.toFixed(2)}</td>
                    <td>${gammaBeffTiAi2.toFixed(2)}</td>
                    <td class="result-value">${layer.EI.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                </tr>
            `;
        });

        this.gammaTableBody.innerHTML = html;
        this.gammaTotalEI.textContent = result.EIeff.toLocaleString('en-US', { maximumFractionDigits: 2 });
    }

    hideResults() {
        this.validationAlert.classList.add('d-none');
        this.resultContent.classList.add('d-none');
    }

    reset() {
        this.layup = new CLTLayupType('CLT Panel', 1000);
        this.layupNameInput.value = 'CLT Panel';
        this.beffInput.value = '1000';
        this.materialGradeSelect.value = 'MGP10';
        this.analyticalMethodSelect.value = 'shear-analogy';
        this.numLayersInput.value = '5';
        this.layerValidation.textContent = '';
        this.layup.analyticalMethod = 'shear-analogy';

        const material = this.getMaterialGrade();
        for (let i = 0; i < 5; i++) {
            const orientation = (i % 2 === 0) ? 0 : 90;
            const layer = new CLTLayerType(35, orientation, material);
            this.layup.addLayer(layer);
        }

        this.renderLayers();
        this.updateLayerCount();
        this.hideResults();
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CalculatorApp();
});