import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

import { ThfTableColumn, ThfPageFilter, ThfModalComponent, ThfComboOption, ThfRadioGroupOption,
  ThfCheckboxGroupOption, ThfModalAction, ThfDisclaimerGroup, ThfDisclaimer, ThfPageAction, ThfTableAction,
  ThfNotificationService, ThfTableComponent } from '@totvs/thf-ui';

@Component({
  selector: 'app-customer-list',
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.css']
})
export class CustomerListComponent implements OnInit, OnDestroy {

  @ViewChild('table', null) table: ThfTableComponent;

  private customerRemoveSub: Subscription;
  private customersRemoveSub: Subscription;

  public readonly actions: Array<ThfPageAction> = [
    { action: this.onNewCustomer.bind(this), label: 'Cadastrar', icon: 'thf-icon-user-add' },
    // NOVA AÇÃO PARA A PÁGINA
    { action: this.onRemoveCustomers.bind(this), label: 'Remover clientes' }
  ];

  // LISTA DE AÇÕES PARA O TABLE
  public readonly tableActions: Array<ThfTableAction> = [
    { action: this.onViewCustomer.bind(this), label: 'Visualizar' },
    // CONFIGURAÇÃO DO DISABLED DA AÇÃO
    { action: this.onEditCustomer.bind(this),
      disabled: this.canEditCustomer.bind(this), label: 'Editar' },
    { action: this.onRemoveCustomer.bind(this), label: 'Remover', type: 'danger', separator: true }
  ];

  public readonly disclaimerGroup: ThfDisclaimerGroup = {
    // FUNÇÃO QUE SERÁ DISPARADA QUANDO O THFDISCLAIMERGROUP SOFRER ALGUMA ALTERAÇÃO
    change: this.onChangeDisclaimerGroup.bind(this),
    disclaimers: [ ],
    title: 'Filtros aplicados em nossa pesquisa'
  };

  // PROPRIEDADE PARA ARMAZENAR OS FILTROS DA PESQUISA AVANÇADA
  private searchFilters: any;

  // OBJETO QUE DEFINE A AÇÃO DE CONFIRMAÇÃO
  public readonly advancedFilterPrimaryAction: ThfModalAction = {
    // VAI CHAMAR A NOSSA FUNÇÃO QUE PASSA OS PARAMETROS QUE DEVEM SER FILTRADOS
    action: this.onConfirmAdvancedFilter.bind(this),
    label: 'Pesquisar'
  };

  // OBJETO QUE DEFINE A AÇÃO DE CANCELAMENTO
  public readonly advancedFilterSecondaryAction: ThfModalAction = {
    // SIMPLESMENTE FECHA O MODAL SE HOUVER CANCELAMENTO
    action: () => this.advancedFilter.close(),
    label: 'Cancelar'
  };

  // PROPRIEDADES QUE ARMAZERAM O QUE FOR DIGITADO NA PESQUISA AVANÇADA
  public city: string;
  public genre: string;
  public name: string;
  public status: Array<string> = [];

  public readonly statusOptions: Array<ThfCheckboxGroupOption> = [
    { label: 'Ativo', value: 'Active' },
    { label: 'Inativo', value: 'Inactive' }
  ];

  public readonly genreOptions: Array<ThfRadioGroupOption> = [
    { label: 'Feminino', value: 'Female' },
    { label: 'Masculino', value: 'Male' },
    { label: 'Outros', value: 'Other' }
  ];

  public readonly cityOptions: Array<ThfComboOption> = [
    { label: 'Araquari', value: 'Araquari' },
    { label: 'Belém', value: 'Belém' },
    { label: 'Campinas', value: 'Campinas' },
    { label: 'Curitiba', value: 'Curitiba' },
    { label: 'Joinville', value: 'Joinville' },
    { label: 'Osasco', value: 'Osasco' },
    { label: 'Rio de Janeiro', value: 'Rio de Janeiro' },
    { label: 'São Bento', value: 'São Bento' },
    { label: 'São Francisco', value: 'São Francisco' },
    { label: 'São Paulo', value: 'São Paulo' }
  ];

  @ViewChild('advancedFilter', null) advancedFilter: ThfModalComponent;

  private searchTerm: string = '';

  private page: number = 1;

  public hasNext: boolean = false;

  // INICIALIZA COM TRUE PARA A TABELA APARECER COM LOADING ATIVADO
  public loading: boolean = true;

  public readonly filter: ThfPageFilter = {
    action: this.onActionSearch.bind(this),
    // FILTER ATUALIZADO PARA HABILITAR A BUSCA AVANÇADA
    advancedAction: this.openAdvancedFilter.bind(this),
    ngModel: 'searchTerm',
    placeholder: 'Pesquisar por ...'
  };

  public readonly columns: Array<ThfTableColumn> = [
    { property: 'name', label: 'Nome' },
    { property: 'nickname', label: 'Apelido' },
    { property: 'email', label: 'E-mail', type: 'link', action: this.sendMail.bind(this) },
    { property: 'birthdate', label: 'Nascimento', type: 'date', format: 'dd/MM/yyyy', width: '100px' },
    { property: 'genre', label: 'Gênero', type: 'subtitle', width: '80px', subtitles: [
      { value: 'Female', color: 'color-05', content: 'F', label: 'Feminino' },
      { value: 'Male', color: 'color-02', content: 'M', label: 'Masculino' },
      { value: 'Other', color: 'color-08', content: 'O', label: 'Outros' },
    ]},
    { property: 'city', label: 'Cidade' },
    { property: 'status', type: 'label', labels: [
      { value: 'Active', color: 'success', label: 'Ativo' },
      { value: 'Inactive', color: 'danger', label: 'Inativo' }
    ]}
  ];

  // Url do servidor de exemplo
  private readonly url: string = 'https://sample-customers-api.herokuapp.com/api/thf-samples/v1/people';
  private customersSub: Subscription;

  // Nossa lista de clientes
  public customers: Array<any> = [];

  constructor(private httpClient: HttpClient, private router: Router, private thfNotification: ThfNotificationService) { }

  private sendMail(email, customer) {
    const body = `Olá ${customer.name}, gostariamos de agradecer seu contato.`;
    const subject = 'Contato';

    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_self');
  }

  private onRemoveCustomers() {
    // PEGAMOS OS CLIENTES SELECIONADOS DA TABELA
    const selectedCustomers = this.table.getSelectedRows();
    // CRIAMOS UM NOVO ARRAY APENAS COM O ID DOS CLIENTES PARA ENVIAR PARA O BACKEND
    // FAZER A EXCLUSÃO EM LOTE
    const customersWithId = selectedCustomers.map(customer => ({ id: customer.id}));

    this.customersRemoveSub = this.httpClient.request('delete', this.url, { body: customersWithId } )
      .subscribe(() => {
        this.thfNotification.warning('Clientes apagados em lote com sucesso.');

        // REMOVEMOS OS CLIENTES APAGADOS DA NOSSA TABELA
        selectedCustomers.forEach(customer => {
          this.customers.splice(this.customers.indexOf(customer), 1);
        });
      });
  }

  private onRemoveCustomer(customer) {
    this.customerRemoveSub = this.httpClient.delete(`${this.url}/${customer.id}`)
      .subscribe(() => {
        this.thfNotification.warning('Cadastro do cliente apagado com sucesso.');
        // REMOVE O REGISTRO DA NOSSA TABELA
        this.customers.splice(this.customers.indexOf(customer), 1);
      });
  }

  // FUNÇÃO PRA VERIFICAR SE É POSSÍVEL EDITAR O CLIENTE
  private canEditCustomer(customer) {
    return customer.status !== 'Active';
  }

  // FUNÇÃO PRA NAVEGAR ATÉ A PÁGINA DE EDIÇÃO
  private onEditCustomer(customer) {
    this.router.navigateByUrl(`/customers/edit/${customer.id}`);
  }

  // FUNÇÃO PRA NAVEGAR ATÉ A PÁGINA DE DETALHES
  private onViewCustomer(customer) {
    this.router.navigateByUrl(`/customers/view/${customer.id}`);
  }

  private onNewCustomer() {
    this.router.navigateByUrl('/customers/new');
  }

  // AGORA CADA VEZ QUE O GRUPO DE DISCLAIMERS RECEBER UMA ATUALIZAÇÃO, O MESMO
  // REINICIA A PESQUISA COM OS FILTROS NECESSÁRIOS
  private onChangeDisclaimerGroup(disclaimers: Array<ThfDisclaimer>) {
    this.searchFilters = {};

    this.page = 1;

    // TRANSFORMAR OS DISCLAIMERS EM PARAMETROS PARA A PESQUISA
    disclaimers.forEach(disclaimer => {
      this.searchFilters[disclaimer.property] = disclaimer.value;
    });

    if (!this.searchFilters.search) {
      this.searchTerm = undefined;
    }

    this.loadData(this.searchFilters);
  }

  // FUNÇÃO REFATORADA PARA ADICIONAR OS DISCLAIMERS QUANDO O USUÁRIO CONFIRMAR A PESQUISA AVANÇADA
  private onConfirmAdvancedFilter() {
    const addDisclaimers = (property: string, value: string, label: string) =>
      value && this.disclaimerGroup.disclaimers.push({property, value, label: `${label}: ${value}`});

    this.disclaimerGroup.disclaimers = [];

    addDisclaimers('city', this.city, 'Cidade');
    addDisclaimers('genre', this.genre, 'Gênero');
    addDisclaimers('name', this.name, 'Nome');
    addDisclaimers('status', this.status ? this.status.join(',') : '', 'Status');

    this.advancedFilter.close();
  }

  // FUNÇÃO QUE IRÁ ABRIR NOSSA BUSCA AVANÇADA
  openAdvancedFilter() {
    this.advancedFilter.open();
  }

  // AO EFETUAR NOSSA PESQUISA RÁPIDA PASSAMOS APENAS A ATUALIZAR OS DISCLAIMERS
  // SEM PRECISAR CHAMAR A NOSSA FUNÇÃO DE CARGA DE DADOS
  private onActionSearch() {
    this.disclaimerGroup.disclaimers = [{
      label: `Pesquisa rápida: ${this.searchTerm}`,
      property: 'search',
      value: this.searchTerm
    }];
  }

  // FUNÇÃO RESPONSÁVEL POR SOLICITAR UMA NOVA PÁGINA E MANTER A PESQUISA ATIVA
  showMore() {
    let params: any = {
      page: ++this.page
    };

    if (this.searchTerm) {
      params.search = this.searchTerm;
    } else {
      params = { ...params, ...this.searchFilters };
    }

    this.loadData(params);
  }

  private loadData(params: { page?: number, search?: string } = { }) {
    this.loading = true;

    // PASSAMOS O QUERYPARAMETERS COMO PARAMETRO DA FUNÇÃO GET, ASSIM NÃO PRECISAMOS MAIS CONCATENAR A URL
    this.customersSub = this.httpClient.get(this.url, { params: <any>params })
      .subscribe((response: { hasNext: boolean, items: Array<any>}) => {
        // QUANDO FOR A PRIMEIRA PÁGINA APENAS REATRIBUIMOS OS DADOS RETORNADOS
        this.customers = !params.page || params.page === 1
          ? response.items
          // A PARTIR DA SEGUNDA PÁGINA NÓS CONCATENAMOS OS DADOS RETORNADOS
          : [...this.customers, ...response.items];
        this.hasNext = response.hasNext;
        this.loading = false;
      });
  }

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    this.customersSub.unsubscribe();

    if (this.customerRemoveSub) {
      this.customerRemoveSub.unsubscribe();
    }

    // NOVAS LINHAS
    if (this.customersRemoveSub) {
      this.customersRemoveSub.unsubscribe();
    }
  }
}
