class MotocicletaAjusteController extends BaseAjusteController {
    constructor() {
        super('Motocicleta', 'http://localhost:3000/api/motocicletas');
        this.searchField = 'placa';
    }

    applyMasks() {
        
        const placaInput = document.getElementById('search-placa');
        placaInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

            if (value.length <= 7) {
                value = value.replace(/^([A-Z]{3})(\d{1})([A-Z0-9]{1})(\d{2})$/, '$1-$2$3$4');
                if (value.length === 4) value = value.replace(/([A-Z]{3})(\d)/, '$1-$2');
            }
            
            e.target.value = value;
        });

        const anoInput = document.getElementById('adjust-ano');
        if (anoInput) {
            anoInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 4) value = value.substring(0, 4);
                e.target.value = value;
            });
        }
    }

    formatSearchValue(value) {
        return value.toUpperCase();
    }

    async buscarItem() {
        const placaInput = document.getElementById('search-placa');
        const placa = placaInput.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

        if (placa.length < 7) {
            Controller.showNotification('Digite uma placa válida', 'error');
            return;
        }

        try {
            const searchBtn = document.getElementById('btn-search');
            Controller.showLoading(searchBtn, true, '<i class="bx bx-search"></i> Buscar');
            
            const response = await fetch(`${this.baseURL}`);
            if (!response.ok) throw new Error('Erro ao buscar motocicletas');
            
            const motocicletas = await response.json();
            const motocicleta = motocicletas.find(m => 
                m.placa.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === placa
            );

            if (!motocicleta) {
                Controller.showNotification('Motocicleta não encontrada', 'error');
                return;
            }

            this.currentItem = motocicleta;
            this.originalData = { ...motocicleta };
            this.preencherFormulario(motocicleta);
            this.mostrarSecaoEdicao();
            Controller.showNotification('Motocicleta encontrada com sucesso!', 'success');

        } catch (error) {
            console.error('Erro ao buscar motocicleta:', error);
            Controller.showNotification('Erro ao buscar motocicleta', 'error');
        } finally {
            const searchBtn = document.getElementById('btn-search');
            Controller.showLoading(searchBtn, false, '<i class="bx bx-search"></i> Buscar');
        }
    }

    preencherFormulario(motocicleta) {
        
        const currentDataDiv = document.getElementById('current-moto-data');
        currentDataDiv.innerHTML = `
            <div class="current-info-grid">
                <div class="info-row">
                    <span class="label">Modelo:</span>
                    <span class="value">${motocicleta.modelo}</span>
                </div>
                <div class="info-row">
                    <span class="label">Placa:</span>
                    <span class="value">${motocicleta.placa}</span>
                </div>
                <div class="info-row">
                    <span class="label">Cor:</span>
                    <span class="value">${motocicleta.cor}</span>
                </div>
                <div class="info-row">
                    <span class="label">Ano:</span>
                    <span class="value">${motocicleta.ano}</span>
                </div>
                <div class="info-row">
                    <span class="label">Quilometragem:</span>
                    <span class="value">${motocicleta.quilometragem ? motocicleta.quilometragem + ' km' : 'Não informado'}</span>
                </div>
                <div class="info-row">
                    <span class="label">Status:</span>
                    <span class="badge badge-${motocicleta.status === 'Ativo' ? 'success' : 'error'}">${motocicleta.status || 'Ativo'}</span>
                </div>
            </div>
        `;

        document.getElementById('adjust-modelo').value = motocicleta.modelo || '';
        document.getElementById('adjust-placa').value = motocicleta.placa || '';
        document.getElementById('adjust-cor').value = motocicleta.cor || '';
        document.getElementById('adjust-ano').value = motocicleta.ano || '';
        document.getElementById('adjust-quilometragem').value = motocicleta.quilometragem || '';

        this.carregarMarcas(motocicleta.marca_id);
        
        document.getElementById('adjust-status').value = motocicleta.status || 'Ativo';
    }

    async carregarMarcas(marcaSelecionada = null) {
        try {
            const response = await fetch('http://localhost:3000/api/marcas');
            if (!response.ok) throw new Error('Erro ao carregar marcas');
            
            const marcas = await response.json();
            const select = document.getElementById('adjust-marca');
            
            select.innerHTML = '<option value="">Selecione uma marca...</option>';
            marcas.forEach(marca => {
                const option = document.createElement('option');
                option.value = marca.id;
                option.textContent = marca.nome;
                if (marca.id === marcaSelecionada) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
            
        } catch (error) {
            console.error('Erro ao carregar marcas:', error);
        }
    }

    extrairDadosFormulario(formData) {
        return {
            modelo: formData.get('modelo'),
            placa: formData.get('placa'),
            cor: formData.get('cor'),
            ano: parseInt(formData.get('ano')) || null,
            quilometragem: parseInt(formData.get('quilometragem')) || null,
            marca_id: parseInt(formData.get('marca')) || null,
            status: formData.get('status')
        };
    }

    verificarMudancas(dadosNovos) {
        const camposParaComparar = ['modelo', 'placa', 'cor', 'ano', 'quilometragem', 'marca_id', 'status'];
        
        for (const campo of camposParaComparar) {
            const valorOriginal = this.originalData[campo];
            const valorNovo = dadosNovos[campo];

            if (campo === 'ano' || campo === 'quilometragem' || campo === 'marca_id') {
                const origNum = valorOriginal ? parseInt(valorOriginal) : null;
                const novoNum = valorNovo ? parseInt(valorNovo) : null;
                
                if (origNum !== novoNum) {
                    return true;
                }
            } else {
                const valorOriginalStr = valorOriginal || '';
                const valorNovoStr = valorNovo || '';
                
                if (valorOriginalStr !== valorNovoStr) {
                    return true;
                }
            }
        }

        return false;
    }

    getItemDisplayName() {
        return `${this.currentItem.modelo} - ${this.currentItem.placa}`;
    }
}
