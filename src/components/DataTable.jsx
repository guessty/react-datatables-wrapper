import React from 'react';
import PropTypes from 'prop-types';
import queryString from 'query-string';
import ReactDOMServer from 'react-dom/server';
import _range from 'lodash.range';
import _debounce from 'lodash.debounce';
import styled from 'styled-components'
//
import StyledLoader from './styled/Loader'
import StyledTable from './styled/Table'

const $ = require('jquery');
$.DataTable = require('datatables.net');


class DataTable extends React.Component {
  componentDidMount() {
    this.destroyed = false;
    this.fetchCounter = 0;
    this.datatable = $(this.table).DataTable({
      dom: this.setDataTableDom(),
      ...this.props,
      scrollY: this.props.scrollY ? '1px' : false,
      scrollCollapse: this.props.scrollY,
      ordering: this.props.ordering,
      paging: this.props.paging,
      pagingType: 'full_numbers',
      searching: this.props.searching,
      searchDelay: 350,
      processing: this.props.serverSide || this.props.processing,
      lengthMenu: [[10, 20, 30, 40, 50, 100, 250], [10, 20, 30, 40, 50, 100, 250]],
      language: {
        processing: ReactDOMServer.renderToString(this.props.loadingComponent),
        search: '',
        searchPlaceholder: 'Search...',
        lengthMenu: 'Show _MENU_ per page.',
        paginate: {
          first: '<<',
          last: '>>',
          previous: '<',
          next: '>',
        },
        aria: {
          paginate: {
            first: 'First',
            last: 'Last',
            previous: 'Previous',
            next: 'Next',
          },
        },
      },
      // DataTables uses Ajax by default but here we stub the default
      // request and use the props.fetchData function instead to fetch the data.
      ajax: this.props.fetchData ? {
        dataSrc: this.props.dataSrc, // Helper prop to access the data in response.
        url: '/get-my-data', // We won't actually be using this.
        beforeSend: (jqXHR, settings) => {
          let fetchParams = {};

          // Access original DataTable query params if props.serverSide
          if (this.props.serverSide) {
            const params = queryString.parse(settings.url.split('?')[1]);

            // Map DataTable query params to something a bit more friendly.
            const sortIndex = params['order[0][column]'];

            fetchParams = {
              sort_index: sortIndex,
              sort_key: params[`columns[${ sortIndex }][data]`],
              sort_direction: params['order[0][dir]'],
              search_text: params['search[value]'],
              start: params.start,
              limit: params.length,
              ...this.props.additionalFetchParams,
            };
          }
          // Fetch Data
          this.fetchCounter += 1;
          const currentFetch = this.fetchCounter;
          this.props.fetchData(fetchParams).then((response) => {
            // Complete cycle by calling the ajax .success method to populate table.
            if (currentFetch === this.fetchCounter && !this.destroyed) {
              settings.success(response);
              this.handleResize();
            }
          });
          // Return false to cancel the original ajax request.
          return false;
        },
      } : null,
      // The drawCallback can be use to modify the table and its rows and cells.
      drawCallback: (settings) => {
        // This option will group data in the table.
        // Currently it only supports grouping on a single column (grouping.columnIndex) using rowSpan.
        // This could be extend further to support other grouping styles if needed.
        if (this.props.grouping && Number.isInteger(this.props.grouping.columnIndex)) {
          const api = settings.oInstance.api();
          const rows = api.rows({ page: 'current' }).nodes();
          const data = api.column(this.props.grouping.columnIndex, { page: 'current' }).data();
          let prevGroup = data[0];
          let prevGroupStart = 0;

          data.each((group, i) => {
            if (prevGroup !== group || i === data.length - 1) {
              const rangeEnd = (i === data.length - 1) ? data.length : i;
              const rowSpan = rangeEnd - prevGroupStart;
              _range(prevGroupStart, rangeEnd).forEach((rowIndex, arrayIndex) => {
                if (arrayIndex === 0) {
                  $(rows).eq(rowIndex).children().eq(this.props.grouping.columnIndex)
                    .attr('rowspan', rowSpan);
                } else {
                  $(rows).eq(rowIndex).children().eq(this.props.grouping.columnIndex)
                    .hide();
                }
              });
              prevGroupStart = i;
              prevGroup = group;
            }
          });
        }

        // support further drawCallback from props passing settings and jquery for dom manipulation (use with care)
        this.props.drawCallback(settings, $);
      },
    });

    if (this.props.searching) {
      const api = this.datatable;
      const $searchInput = $(`#${ this.props.dataTableId }`).find('input[type="search"]');
      $searchInput.off().on('keyup cut paste', _debounce(() =>
        api.search($searchInput.val()).draw(), api.settings()[0].searchDelay));
    }

    if (this.props.scrollY) {
      window.addEventListener('resize', this.handleResize);
      this.handleResize();
    }

    if (this.props.selectable) {
      const { datatable } = this;
      const { onSelect } = this.props;
      $(`#${ this.props.dataTableId } tbody`).off().on('click', 'tr', function () {
        onSelect(datatable.rows(this).data()[0]);
      });
    }

    // Page length change callback
    if (this.props.pageSizeOption) {
      $(`#${ this.props.dataTableId }`).on('length.dt', (e, settings, len) => {
        this.resetPagination();
      });
    }
  }

  componentWillUnmount() {
    this.destroyed = true;

    $(`#${ this.props.dataTableId }`)
      .find('table')
      .DataTable()
      .destroy(true);

    if (this.props.scrollY) {
      window.removeEventListener('resize', this.handleResize);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.data) {
      this.reloadTableData(nextProps.data);
    }
    if (this.props.serverSide && !_.isEqual(this.props.additionalFetchParams, nextProps.additionalFetchParams)) {
      // DataTables only currently listens for table related operations (sorting, searching, etc) to
      // refetch data from the server.
      // If the additionalFetchParams object changes, we also trigger a refetch of server data.
      // This means we can reload the datatable based on extrenal parameter changes e.g filters
      this.datatable.ajax.reload();
    }
  }

  shouldComponentUpdate(nextProps) {
    if (nextProps.data && nextProps.data.length !== this.props.data.length) {
      this.reloadTableData(nextProps.data);
    }
    return false;
  }

  handleResize = () => {
    const $table = $(`#${ this.props.dataTableId }`).find('.dataTables_scroll');
    if ($table[0]) {
      const $head = $table.children('.dataTables_scrollHead');
      const $body = $table.children('.dataTables_scrollBody');
      $body.css('max-height', `${ $table.height() - $head.height() }px`);
      $(`#${ this.props.dataTableId }`).removeClass('data-table--initializing');
    }
  }

  resetPagination = () => {
    const table = $(`#${ this.props.dataTableId }`)
      .find('table')
      .DataTable();
    table.page('first');
  }

  setDataTableDom = () => {
    const dom = `
      <"#${ this.props.dataTableId }.data-table"
        <"flex flex--container flex--gutters flex--full-height"
          ${ this.props.searching ? '<<"flex flex--inline flex--gutters"<"flex-child--xs-1-1 flex-child--sm-2-5 flex-child--md-1-3"f>>>' : '' }
          <"${ this.props.scrollY ? 'flex-child--grow flex-child--reset' : '' }"t>
          ${ this.props.paging ? `<<"flex flex--inline flex--gutters"<"mar-r-3"p>${ this.props.pageSizeOption ? '<l>' : '' }>>` : '' }
          r
        >
      >
    `;
    return dom;
  }

  reloadTableData = (data) => {
    const table = $(`#${ this.props.dataTableId }`)
      .find('table')
      .DataTable();
    table.clear();
    table.rows.add(data);
    table.columns.adjust().draw();
    table.draw();
    if (this.props.scrollY) {
      this.handleResize();
    }
  }

  render() {
    return (
      <StyledTable>
        <table
          ref={ (el) => this.table = el }
          className={ this.props.tableClassName }
        >
          {this.props.tableHead}
        </table>
      </StyledTable>
    );
  }
}

DataTable.propTypes = {
  dataTableId: PropTypes.string,
  tableHead: PropTypes.node.isRequired,
  loadingComponent: PropTypes.node,
  tableClassName: PropTypes.string,
  data: PropTypes.array,
  dataSrc: PropTypes.string,
  serverSide: PropTypes.bool,
  scrollY: PropTypes.bool,
  paging: PropTypes.bool,
  ordering: PropTypes.bool,
  searching: PropTypes.bool,
  processing: PropTypes.bool,
  selectable: PropTypes.bool,
  grouping: PropTypes.object,
  additionalFetchParams: PropTypes.object,
  fetchData: PropTypes.func,
  drawCallback: PropTypes.func,
  onSelect: PropTypes.func,
  loaderTitle: PropTypes.string,
  loaderDescription: PropTypes.string,
  pageSizeOption: PropTypes.bool,
};

DataTable.defaultProps = {
  dataTableId: 'data-table',
  loadingComponent: (
    <StyledLoader>
      <span>...Loading</span>
    </StyledLoader>
  ),
  tableClassName: '',
  data: null,
  dataSrc: 'data',
  serverSide: false,
  scrollY: false,
  paging: false,
  ordering: false,
  searching: false,
  processing: false,
  selectable: false,
  grouping: null,
  fetchData: null,
  additionalFetchParams: {},
  pageSizeOption: false,
  drawCallback: () => {},
  onSelect: () => {},
};

export default DataTable;
