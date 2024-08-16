import React, { useEffect, useRef, useCallback } from "react";
import $ from "jquery";
import "datatables.net";
import "datatables.net-dt";
import { showTemporaryMessage } from "../utils/temporaryMessage";
import { deleteGeometry as apiDeleteGeometry } from "../services/api";
import "../styles/DataTable.css";

function DataTable({ features, centerAndZoomToGeometry, updateGeometryWkt, deleteGeometry, toggleDataTable, hidePopup }) {
  const tableRef = useRef(null);
  const dataTableRef = useRef(null);
  const pageLengthRef = useRef(5);
  const pageRef = useRef(0);
  const searchRef = useRef('');

  const handleZoom = useCallback((data) => {
    const feature = features.find(f => f.getId() === data.id);
    if (feature) {
      toggleDataTable();
      centerAndZoomToGeometry(feature.getGeometry());
      showTemporaryMessage(`Zoomed to ${data.geometryType} '${data.name}'`);
      hidePopup();
    }
  }, [features, centerAndZoomToGeometry, toggleDataTable, hidePopup]);

  const handleUpdate = useCallback((data) => {
    const feature = features.find(f => f.getId() === data.id);
    if (feature) {
      updateGeometryWkt(feature);
      hidePopup();
    }
  }, [features, updateGeometryWkt, hidePopup]);

  const handleDelete = useCallback(async (data) => {
    const type = data.geometryType;
    const geoName = data.name;

    if (window.confirm(`Are you sure you want to delete ${type} '${geoName}'?`)) {
      const feature = features.find(f => f.getId() === data.id);
      if (feature) {
        const result = await apiDeleteGeometry(feature);
        if (result.success) {
          const currentPage = dataTableRef.current.page();
          deleteGeometry(feature);
          showTemporaryMessage(`${type} '${geoName}' deleted successfully`);
          hidePopup();

          const newTotalPages = dataTableRef.current.page.info().pages;
          const newPage = Math.min(currentPage, newTotalPages - 1);
          dataTableRef.current.page(newPage).draw(false);
        } else {
          showTemporaryMessage(`Failed to delete: ${result.error}`);
        }
      }
    }
  }, [features, deleteGeometry, hidePopup]);

  const initDataTable = useCallback(() => {
    if ($.fn.DataTable.isDataTable(tableRef.current)) {
      pageLengthRef.current = $(tableRef.current).DataTable().page.len();
      pageRef.current = $(tableRef.current).DataTable().page();
      searchRef.current = $(tableRef.current).DataTable().search();
      $(tableRef.current).DataTable().destroy();
    }

    dataTableRef.current = $(tableRef.current).DataTable({
      columns: [
        { data: "name", title: "Name" },
        { data: "geometryType", title: "Geometry" },
        {
          data: null,
          title: "Actions",
          render: function (row) {
            return `
              <button class="dt-btn dt-btn-zoom" data-id="${row.id}">Zoom</button>
              <button class="dt-btn dt-btn-update" data-id="${row.id}">Update</button>
              <button class="dt-btn dt-btn-delete" data-id="${row.id}">Delete</button>
            `;
          },
        },
      ],
      dom: '<"top"f><"spacer"><"clear">rt<"bottom"ipl>',
      lengthMenu: [5, 10, 25, 50],
      pageLength: pageLengthRef.current,
      scrollY: "300px",
      scrollCollapse: true,
      language: {
        search: "Filter:",
        searchPlaceholder: "Search...",
      },
      search: {
        search: searchRef.current,
      },

      initComplete: function () {
        $(".spacer").css("height", "10px");
        $(".bottom").css("padding-top", "20px");
        $(".top").css("padding-top", "60px");
      },
      createdRow: function(row, data) {
        $(row).attr('data-id', data.id);
      },
    });

    $(tableRef.current).off('click', '.dt-btn-zoom');
    $(tableRef.current).off('click', '.dt-btn-update');
    $(tableRef.current).off('click', '.dt-btn-delete');

    $(tableRef.current).on('click', '.dt-btn-zoom', function(e) {
      e.stopPropagation();
      const data = dataTableRef.current.row($(this).closest('tr')).data();
      handleZoom(data);
    });

    $(tableRef.current).on('click', '.dt-btn-update', function(e) {
      e.stopPropagation();
      const data = dataTableRef.current.row($(this).closest('tr')).data();
      handleUpdate(data);
    });

    $(tableRef.current).on('click', '.dt-btn-delete', function(e) {
      e.stopPropagation();
      const data = dataTableRef.current.row($(this).closest('tr')).data();
      handleDelete(data);
    });

    $(tableRef.current).on('length.dt', function(e, settings, len) {
      pageLengthRef.current = len;
    });

    $(tableRef.current).on('page.dt', function() {
      pageRef.current = dataTableRef.current.page();
    });

    $(tableRef.current).on('search.dt', function() {
      searchRef.current = dataTableRef.current.search();
    });

  }, [handleZoom, handleUpdate, handleDelete]);

  const updateDataTable = useCallback(() => {
    if (!features || !dataTableRef.current) return;

    const tableData = features.map((feature) => ({
      id: feature.getId(),
      name: feature.get("name"),
      geometryType: feature.getGeometry().getType(),
    }));

    dataTableRef.current.clear().rows.add(tableData).draw(false);

    const newTotalPages = dataTableRef.current.page.info().pages;
    let pageToDisplay = Math.min(pageRef.current, newTotalPages - 1);
    pageToDisplay = Math.max(0, pageToDisplay);

    dataTableRef.current.page.len(pageLengthRef.current).page(pageToDisplay).draw(false);
    dataTableRef.current.search(searchRef.current).draw(false);

  }, [features]);

  useEffect(() => {
    initDataTable();
    return () => {
      if (dataTableRef.current) {
        dataTableRef.current.destroy();
      }
    };
  }, [initDataTable]);

  useEffect(() => {
    if (dataTableRef.current) {
      updateDataTable();
    }
  }, [features, updateDataTable]);

  return (
    <div id="data-table-container">
      <table
        ref={tableRef}
        id="data-table"
        className="display"
        style={{ width: "100%" }}
      ></table>
    </div>
  );
}

export default DataTable;